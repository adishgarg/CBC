/**
 * Recursive Drive monitor that notifies the dashboard webhook when new files
 * are detected (treating them as uploads).
 *
 * Requires these Script Properties to be set:
 * - WEBHOOK_URL
 * - WEBHOOK_SECRET (optional)
 *
 * Usage: set `ROOT_FOLDER_ID` and install a time-driven trigger for
 * `monitorRootFolder`.
 */

const ROOT_FOLDER_ID = '11xUN-pe2IJL6u78Mo645pkWYDDhYZ2ry';

function monitorRootFolder() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('WEBHOOK_URL')) {
    throw new Error('Missing WEBHOOK_URL script property.');
  }

  // scan and collect updated state, but don't write per-file props repeatedly
  var stateChanges = {};
  scanFolderRecursive_(ROOT_FOLDER_ID, props, stateChanges);

  // persist changed folder states in a single call
  Object.keys(stateChanges).forEach(function (key) {
    props.setProperty(key, JSON.stringify(stateChanges[key]));
  });
}

function scanFolderRecursive_(folderId, props, stateChanges) {
  var folder = DriveApp.getFolderById(folderId);

  // collect current file ids
  var files = folder.getFiles();
  var currentFileIds = [];

  while (files.hasNext()) {
    currentFileIds.push(files.next().getId());
  }

  var stateKey = 'drive-monitor-state:' + folderId;
  var raw = props.getProperty(stateKey);
  var previousIds = [];

  if (raw) {
    try {
      var parsed = JSON.parse(raw);
      previousIds = Array.isArray(parsed.fileIds) ? parsed.fileIds.map(String) : [];
    } catch (e) {
      previousIds = [];
    }
  }

  var previousIdMap = {};
  previousIds.forEach(function (id) {
    previousIdMap[id] = true;
  });

  var newFileIds = currentFileIds.filter(function (id) {
    return !previousIdMap[id];
  });

  if (newFileIds.length) {
    newFileIds.forEach(function (fileId) {
      try {
        var file = DriveApp.getFileById(fileId);
        var payload = {
          folderId: folderId,
          folderName: folder.getName(),
          fileId: file.getId(),
          fileName: file.getName(),
          fileUrl: file.getUrl(),
          mimeType: file.getMimeType(),
          uploadedAt: file.getDateCreated().toISOString(),
          source: 'drive'
        };

        postWebhookPayload_(payload, props);
      } catch (err) {
        console.warn('Failed to process new file ' + fileId + ': ' + err);
      }
    });
  }

  // save trimmed state (keep last 500 ids to avoid unbounded growth)
  stateChanges[stateKey] = {
    fileIds: currentFileIds.slice(-500),
    updatedAt: new Date().toISOString()
  };

  // recurse into children
  var folders = folder.getFolders();
  while (folders.hasNext()) {
    var child = folders.next();
    scanFolderRecursive_(child.getId(), props, stateChanges);
  }
}

function postWebhookPayload_(payload, props) {
  var webhookUrl = props.getProperty('WEBHOOK_URL');
  var webhookSecret = props.getProperty('WEBHOOK_SECRET');

  var headers = {
    'Content-Type': 'application/json'
  };
  if (webhookSecret) headers['x-apps-script-secret'] = webhookSecret;

  var response = UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    muteHttpExceptions: true,
    headers: headers,
    payload: JSON.stringify(payload)
  });

  Logger.log('Webhook ' + webhookUrl + ' -> ' + response.getResponseCode() + ': ' + response.getContentText());

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    // don't throw here to allow other files to be processed; log for later inspection
    console.warn('Non-2xx response from webhook for file ' + payload.fileId + ': ' + response.getResponseCode());
  }
}
