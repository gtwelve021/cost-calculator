var SHEET_ID = '1oG10Q8gWyeiqS0rl0sNik7radJFkZQJ1okWuz8D0N04';
var SHEET_NAME = 'cost-calculator';

var HEADERS = [
  'Timestamp',
  'Full Name',
  'Phone',
  'Email',
  'License',
  'Duration (Years)',
  'Shareholders',
  'Activities',
  'Investor Visa',
  'Employee Visas',
  'Dependent Visas',
  'Applicants Inside UAE',
  'Add-Ons',
  'Total (AED)'
];

function headerCell(value) {
  return String(value || '').trim().toLowerCase();
}

function headersMatch(firstRow) {
  if (!firstRow || firstRow.length < HEADERS.length) {
    return false;
  }

  for (var i = 0; i < HEADERS.length; i++) {
    if (headerCell(firstRow[i]) !== headerCell(HEADERS[i])) {
      return false;
    }
  }

  return true;
}

function ensureHeaders(sheet) {
  var lastRow = sheet.getLastRow();

  if (lastRow === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    return;
  }

  var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (!headersMatch(firstRow)) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  ensureHeaders(sheet);

  return sheet;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.fullName || '',
      data.phone || '',
      data.email || '',
      data.licenseName || '',
      data.durationYears || 0,
      data.shareholders || 0,
      data.activities || '',
      data.investorVisa || 'No',
      data.employeeVisas || 0,
      data.dependentVisas || 0,
      data.applicantsInsideUae || 0,
      data.addOns || '',
      data.totalAed || 0
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('G12 Cost Calculator API is running.');
}

function testSetup() {
  var sheet = getOrCreateSheet();
  Logger.log('Sheet ready: ' + sheet.getName() + ' (' + sheet.getLastRow() + ' rows)');
}

function repairHeaders() {
  var sheet = getOrCreateSheet();
  Logger.log('Headers ensured for: ' + sheet.getName());
}
