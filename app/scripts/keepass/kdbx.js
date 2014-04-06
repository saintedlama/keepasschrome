/*

 readKeePassFile(dataView, filePasswords):

 Parameters:

 * dataView: a jDataView instance of the byte array
 representing a KeePass file
 * filePasswords: the passwords (array of strings) to open this file

 Returns: An array of objects whose fields are:

 * UserName
 * Password
 * Notes
 * Title
 * URL

 Copyright 2013 Nam T. Nguyen
 Distributed under the GPL license version 2 or later.

 */

// use strict

var EndOfHeader = 0;
var Comment = 1;
var CipherID = 2;
var CompressionFlags = 3;
var MasterSeed = 4;
var TransformSeed = 5;
var TransformRounds = 6;
var EncryptionIV = 7;
var ProtectedStreamKey = 8;
var StreamStartBytes = 9;
var InnerRandomStreamID = 10;

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

// copied from https://developer.mozilla.org/en-US/docs/Using_XPath
// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
function evaluateXPath(aNode, aExpr) {
    var xpe = new XPathEvaluator();
    var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
        aNode.documentElement : aNode.ownerDocument.documentElement);
    var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
    var found = [];
    var res;

    while (res = result.iterateNext()) {
        found.push(res);
    }

    return found;
}

function readPassword(password) {
    return CryptoJS.SHA256(password);
}

function decodeUtf8(value) {
    return decodeURIComponent(escape(value));
}

function readKeePassFile(dataView, filePasswords) {
    var sig1 = dataView.getUint32();
    var sig2 = dataView.getUint32();
    assert(sig1 == 0x9AA2D903, "Invalid version");
    assert(sig2 == 0xB54BFB67, "Invalid version");
    var fileVersion = dataView.getUint32();
    assert(fileVersion == 0x00030001, "Invalid file version");

    var header = {};
    while (true) {
        var fieldId = dataView.getUint8();
        var fieldSize = dataView.getUint16();
        var data = dataView.getString(fieldSize);
        if (fieldId == EndOfHeader) {
            break;
        }
        switch (fieldId) {
            case TransformRounds:
                var v = new jDataView(data, 0, data.length, true);
                header[fieldId] = v.getUint64();
                break;
            default:
                header[fieldId] = data;
        }
    }
    assert(header[MasterSeed].length == 32, "Master seed not 32 bytes");
    assert(header[TransformSeed].length == 32, "Transform seed not 32 bytes");
    assert(header[InnerRandomStreamID] == "\x02\x00\x00\x00", "Not Salsa20 CrsAlgorithm");
    assert(header[CipherID] == ("\x31\xC1\xF2\xE6\xBF\x71\x43\x50\xBE\x58\x05\x21\x6A\xFC\x5A\xFF"), "Not AES");

    var compositeKey = "";
    for (var i = 0; i < filePasswords.length; ++i) {
        var regular = filePasswords[i];
        compositeKey += regular.toString(CryptoJS.enc.Hex);
    }

    compositeKey = CryptoJS.enc.Hex.parse(compositeKey);
    compositeKey = CryptoJS.SHA256(compositeKey).toString(CryptoJS.enc.Hex);
    compositeKey = compositeKey.toString(CryptoJS.enc.Hex);

    var tmpKey = {};
    tmpKey[0] = CryptoJS.enc.Hex.parse(compositeKey.substring(0, 32));
    tmpKey[1] = CryptoJS.enc.Hex.parse(compositeKey.substring(32, 64));

    var key = CryptoJS.enc.Latin1.parse(header[TransformSeed]);
    var iv = CryptoJS.enc.Hex.parse((new Array(16)).join("\x00"));
    for (var i = 0; i < header[TransformRounds]; ++i) {
        for (var j = 0; j < 2; ++j) {
            var encrypted = CryptoJS.AES.encrypt(tmpKey[j], key,
                { mode: CryptoJS.mode.ECB, iv: iv,
                    padding: CryptoJS.pad.NoPadding });
            tmpKey[j] = encrypted.ciphertext;
        }
    }

    tmpKey = CryptoJS.enc.Hex.parse(
        tmpKey[0].toString(CryptoJS.enc.Hex) +
            tmpKey[1].toString(CryptoJS.enc.Hex)
    );

    var transformedKey = CryptoJS.SHA256(tmpKey).toString(CryptoJS.enc.Hex);

    var masterSeed = CryptoJS.enc.Latin1.parse(header[MasterSeed]);
    masterSeed = masterSeed.toString(CryptoJS.enc.Hex);
    var combinedKey = CryptoJS.enc.Hex.parse(masterSeed + transformedKey);

    var aesKey = CryptoJS.SHA256(combinedKey);

    var aesIV = CryptoJS.enc.Latin1.parse(header[EncryptionIV]);

    var encryptedData = dataView.getString();
    encryptedData = CryptoJS.enc.Latin1.parse(encryptedData);
    var cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: encryptedData
    });
    var decryptedData = CryptoJS.AES.decrypt(cipherParams, aesKey,
        { mode: CryptoJS.mode.CBC, iv: aesIV,
            padding: CryptoJS.pad.Pkcs7 });

    decryptedData = decryptedData.toString(CryptoJS.enc.Latin1);

    dataView = new jDataView(decryptedData, 0, decryptedData.length, true);
    var decryptedStartBytes = dataView.getString(32);
    assert(decryptedStartBytes == header[StreamStartBytes], "Start bytes do not match");

    var gzipData = "";
    var blockId = 0;
    while (true) {
        assert(dataView.getUint32() == blockId, "Wrong block from gzip stream");
        ++blockId;
        var blockHash = dataView.getString(32);
        var blockSize = dataView.getUint32();
        if (blockSize == 0) {
            for (var i = 0; i < 32; ++i) {
                assert(blockHash[i] == "\x00", "blockHash not all zeroes");
            }
            break;
        }
        var blockData = dataView.getString(blockSize);
        var computedHash = CryptoJS.SHA256(CryptoJS.enc.Latin1.parse(blockData));
        assert(blockHash == computedHash.toString(CryptoJS.enc.Latin1), "Block hash does not match");
        gzipData += blockData;
    }

    // ignore first 10 bytes (GZip header)
    gzipData = gzipData.substring(10);
    var xmlData = zip_inflate(gzipData);
    xmlData = decodeUtf8(xmlData);
    assert(xmlData.indexOf("<?xml") == 0, "XML data is not valid");

    var xml = (new DOMParser()).parseFromString(xmlData, "text/xml");
    var keepassEntries = new Array();
    var entries = evaluateXPath(xml, "//Entry");

    var hashedProtectedStreamKey = CryptoJS.SHA256(
        CryptoJS.enc.Latin1.parse(header[ProtectedStreamKey]));

    hashedProtectedStreamKey = hashedProtectedStreamKey.toString(
        CryptoJS.enc.Latin1);
    assert(hashedProtectedStreamKey.length == 32, "hashedProtectedStreamKey invalid");
    var salsaKey = new Array(32);
    for (var i = 0; i < 32; ++i) {
        salsaKey[i] = hashedProtectedStreamKey.charCodeAt(i) & 0xFF;
    }
    var iv = new Uint8Array([0xE8, 0x30, 0x09, 0x4B, 0x97, 0x20, 0x5D, 0x2A]);
    var salsa = new Salsa20(salsaKey, iv);

    for (var i in entries) {
        var keys = evaluateXPath(entries[i], "String/Key");
        var values = evaluateXPath(entries[i], "String/Value");
        assert(keys.length == values.length, "different key and value sizes");
        var properties = {};
        for (var j in keys) {
            var value = values[j].textContent;
            if (values[j].getAttribute("Protected") == "True") {
                value = atob(value);
                var xorbuf = salsa.getBytes(value.length);

                var r = new Array();
                for (var k = 0; k < value.length; ++k) {
                    r[k] = String.fromCharCode(value.charCodeAt(k) ^ xorbuf[k]);
                }
                value = r.join("");
                value = decodeUtf8(value);
            }
            properties[keys[j].textContent] = value;
        }

        if (entries[i].parentNode.nodeName == "History") {
            // ignore History
            continue;
        }

        keepassEntries.push(properties);
    }

    return keepassEntries;
}
