/**
 * Forme → Google Sheets bridge.
 * Set script properties FORME_SECRET (24+ characters), SPREADSHEET_ID.
 * Deploy as Web App, execute as yourself, allow anyone. Secret gates requests.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty('FORME_SECRET');
    var data = JSON.parse(e.postData.contents);
    if (!expected || expected.length < 24 || data.secret !== expected) return result({ok:false});
    var book = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
    var sheet = book.getSheetByName('Forme Responses') || book.insertSheet('Forme Responses');
    if (sheet.getLastRow() === 0) sheet.appendRow(['Submission ID', 'Submitted at']);
    var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    var ids = sheet.getLastRow()>1 ? sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues().flat() : [];
    if (ids.indexOf(data.id) !== -1) return result({ok:true,duplicate:true});
    var answers = data.answers || {};
    Object.keys(answers).forEach(function(id) {
      // Include stable ID so renamed or identical labels never mix columns.
      var header = ((data.labels || {})[id] || id) + ' [' + id + ']';
      if (headers.indexOf(header) === -1) headers.push(header);
    });
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    var row = headers.map(function(h,i) {
      if(i===0)return data.id;if(i===1)return data.createdAt;
      var match = h.match(/\[([^\]]+)\]$/);
      var value = match ? answers[match[1]] : '';
      if(Array.isArray(value))value=value.join(', ');
      if(value===undefined||value===null)return '';
      value=String(value);
      return /^[\s]*[=+\-@\t\r]/.test(value) ? "'"+value : value;
    });
    sheet.appendRow(row);
    return result({ok:true});
  } catch(error) { return result({ok:false}); }
  finally { lock.releaseLock(); }
}
function result(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
