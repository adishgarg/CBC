/**
 * Google Apps Script: poll one or more Google Drive folders for new files,
 * then notify the dashboard webhook so WhatsApp messages can be sent.
 *
 * Expected config sheet columns:
 * enabled | projectId | folderId | projectName | note
 *
 * Script properties:
 * - WEBHOOK_URL: your dashboard webhook URL, e.g. https://your-app.com/api/drive-webhook
 * - WEBHOOK_SECRET: secret shared with the dashboard
 * - CONFIG_SPREADSHEET_ID: spreadsheet ID that contains the config sheet
 * - CONFIG_SHEET_NAME: optional, defaults to DriveWatchConfig
 */

var CONFIG_SHEET_NAME = 'DriveWatchConfig';
var STATE_PREFIX = 'drive-watch-state:';

function onDriveFolderUploadTrigger() {
  var rows = loadWatchRows_();
  if (!rows.length) {
    console.log('No enabled Drive watch rows found.');
    return;
  }

  var totalEventsSent = 0;
  var failedEvents = [];

  rows.forEach(function (row) {
    var folderId = String(row.folderId || '').trim();
    var projectId = String(row.projectId || '').trim();

    if (!row.enabled || !folderId || !projectId) {
      return;
    }

    var folder = DriveApp.getFolderById(folderId);
    var currentFileIds = collectFileIdsRecursive_(folder);

    var state = loadState_(folderId);

    if (!state.initialized) {
      saveState_(folderId, currentFileIds);
      console.log('Initialized Drive watch state for folder: ' + folder.getName());
      return;
    }

    var previousFileIds = state.fileIds;
    var previousFileIdMap = buildIdSet_(previousFileIds);

    var newFileIds = currentFileIds.filter(function (fileId) {
      return !previousFileIdMap[fileId];
    });

    if (!newFileIds.length) {
      saveState_(folderId, currentFileIds);
      return;
    }

    var folderFailed = false;

    newFileIds.forEach(function (fileId) {
      try {
        var file = DriveApp.getFileById(fileId);

        var payload = {
          folderId: folderId,
          folderName: folder.getName(),
          projectId: projectId,
          projectName: row.projectName || '',
          fileId: file.getId(),
          fileName: file.getName(),
          fileUrl: file.getUrl(),
          mimeType: file.getMimeType(),
          uploadedAt: file.getDateCreated().toISOString(),
          note: row.note || '',
          source: 'drive'
        };

        postWebhook_(payload);
        totalEventsSent += 1;
      } catch (error) {
        folderFailed = true;
        failedEvents.push({
          fileId: fileId,
          error: String(error)
        });
      }
    });

    if (!folderFailed) {
      saveState_(folderId, currentFileIds);
    }
  });

  if (failedEvents.length) {
    throw new Error(
      'Failed to deliver ' + failedEvents.length + ' webhook event(s). State was not updated for affected folders.'
    );
  }

  console.log('Drive watch completed. Notifications sent: ' + totalEventsSent);
}

function loadWatchRows_() {
  var sheet = getConfigSheet_();
  var values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  var headers = values[0].map(function (header) {
    return String(header || '').trim();
  });

  return values.slice(1).map(function (row) {
    var record = {};

    headers.forEach(function (header, index) {
      record[header] = row[index];
    });

    return {
      enabled: isTruthy_(record.enabled),
      projectId: record.projectId,
      folderId: record.folderId,
      projectName: record.projectName,
      note: record.note
    };
  });
}

function getConfigSheet_() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('CONFIG_SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('Missing CONFIG_SPREADSHEET_ID script property.');
  }

  var sheetName = props.getProperty('CONFIG_SHEET_NAME') || CONFIG_SHEET_NAME;
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('Missing config sheet: ' + sheetName);
  }

  return sheet;
}

function collectFileIdsRecursive_(folder) {
  var fileIds = [];

  var files = folder.getFiles();
  while (files.hasNext()) {
    fileIds.push(files.next().getId());
  }

  var folders = folder.getFolders();
  while (folders.hasNext()) {
    var childFolder = folders.next();
    fileIds = fileIds.concat(collectFileIdsRecursive_(childFolder));
  }

  return fileIds;
}

function buildIdSet_(ids) {
  var idSet = {};

  ids.forEach(function (id) {
    idSet[String(id)] = true;
  });

  return idSet;
}

function loadState_(folderId) {
  var raw = PropertiesService.getScriptProperties().getProperty(STATE_PREFIX + folderId);

  if (!raw) {
    return {
      initialized: false,
      fileIds: []
    };
  }

  try {
    var parsed = JSON.parse(raw);
    return {
      initialized: true,
      fileIds: Array.isArray(parsed.fileIds) ? parsed.fileIds.map(String) : []
    };
  } catch (error) {
    console.warn('Could not parse state for folder ' + folderId + ': ' + error);
    return {
      initialized: false,
      fileIds: []
    };
  }
}

function saveState_(folderId, fileIds) {
  var trimmedFileIds = fileIds.slice(-200).map(String);
  PropertiesService.getScriptProperties().setProperty(
    STATE_PREFIX + folderId,
    JSON.stringify({
      fileIds: trimmedFileIds,
      updatedAt: new Date().toISOString()
    })
  );
}

function postWebhook_(payload) {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty('WEBHOOK_URL');
  var webhookSecret = props.getProperty('WEBHOOK_SECRET');

  if (!webhookUrl) {
    throw new Error('Missing WEBHOOK_URL script property.');
  }

  var headers = {
    'Content-Type': 'application/json'
  };

  if (webhookSecret) {
    headers['x-apps-script-secret'] = webhookSecret;
  }

  var response = UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    muteHttpExceptions: true,
    headers: headers,
    payload: JSON.stringify(payload)
  });

  var responseCode = response.getResponseCode();
  var responseBody = response.getContentText();

  console.log('Webhook response ' + responseCode + ': ' + responseBody);

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error('Webhook request failed with status ' + responseCode);
  }
}

function isTruthy_(value) {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;

  var normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y';
}

function setupDriveWatchSheet() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('CONFIG_SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('Set CONFIG_SPREADSHEET_ID before running setup.');
  }

  var sheetName = props.getProperty('CONFIG_SHEET_NAME') || CONFIG_SHEET_NAME;
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);

  sheet.clear();
  sheet.getRange(1, 1, 1, 5).setValues([
    ['enabled', 'projectId', 'folderId', 'projectName', 'note']
  ]);
  sheet.setFrozenRows(1);

  console.log('Drive watch sheet ready: ' + sheetName);
}

function clearDriveWatchState() {
  var props = PropertiesService.getScriptProperties();
  var keys = props.getKeys();

  keys.forEach(function (key) {
    if (key.indexOf(STATE_PREFIX) === 0) {
      props.deleteProperty(key);
    }
  });

  console.log('Cleared stored Drive watch state.');
}
