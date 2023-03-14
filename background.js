import Semaphore from "./semaphore.js";
import { log } from "./logger.js";


const COLOR_POSITIVE_COUNT = "#7bd96a";
const COLOR_NEGATIVE_COUNT = "#ed5342";
const COLOR_NEUTRAL = "#969696";

const UPDATE_DELAY = 150;  // in milliseconds


var throttler = new Semaphore(1);  // Used to prevent race conditions

log('Started extension');


// Initialize extension

log("Starting initialization...");
throttler.callFunction(intitialize);

async function intitialize() {
    // Get current date
    let today = new Date();
    let date = today.getDate() + '-' + (today.getMonth()+1) + '-' + today.getFullYear();
    log(`Determined today's date: ${date}`, 1);

    // Get all stored data and current tab count
    let { lastStarted, tabRecord, totalCount, last6Records, last6Totals } = await chrome.storage.local.get(null);
    let currentTabCount = (await chrome.tabs.query({})).length;
    log('Got current stored data:', 1, { lastStarted, tabRecord, totalCount, last6Records, last6Totals, currentTabCount });

    // If the extension is not started on a new day, set the badge and return
    log(`Extension is started on a new day: ${lastStarted !== date}`, 1);
    if (lastStarted === date) {
        let newTabRecord = currentTabCount - totalCount + tabRecord;
        log(`Calculated new tab record: ${newTabRecord}`, 1);
        updateBadge(newTabRecord);
        log('Updated badge', 1);
        chrome.storage.local.set({ "tabRecord": newTabRecord, "totalCount": currentTabCount });
        log('Updated local storage', 1);
        log('Finished initialization');
        return;
    }

    // If the extension *is* started on a new day, determine the new record, set the badge ...
    let newTabRecord = currentTabCount - totalCount;//last6Totals[0];
    log(`Calculated new tab record: ${newTabRecord}`, 1);
    updateBadge(newTabRecord);
    log('Updated badge', 1);
    // ... and 'shift' the last days' data by one day
    let newLast6Records = [tabRecord, ...last6Records.slice(0, 5)];
    log(`Determiend new last 6 records: ${newLast6Records}`, 1);
    let newLast6Totals = [totalCount, ...last6Totals.slice(0, 5)];
    log(`Determiend new last 6 totals: ${newLast6Totals}`, 1);
    chrome.storage.local.set({
        "lastStarted": date,
        "tabRecord": newTabRecord,
        "totalCount": currentTabCount,
        "last6Records": newLast6Records,
        "last6Totals": newLast6Totals
    });
    log('Updated local storage', 1);
    log('Finished initialization');
}


// Add event listeners

let plannedRecordUpdate = 0;
let timeout = null;

chrome.tabs.onCreated.addListener(function() {
    log('New tab was created');
    //throttler.callFunction(updateTodayTabRecord, (x) => x + 1);
    if (timeout) {
        clearTimeout(timeout);
    }
    plannedRecordUpdate += 1;
    timeout = setTimeout(updateTodayTabRecord, UPDATE_DELAY, (x) => x + plannedRecordUpdate);
});

chrome.tabs.onRemoved.addListener(function() {
    log('Tab was removed');
    //throttler.callFunction(updateTodayTabRecord, (x) => x - 1);
    if (timeout) {
        clearTimeout(timeout);
    }
    plannedRecordUpdate -= 1;
    timeout = setTimeout(updateTodayTabRecord, UPDATE_DELAY, (x) => x + plannedRecordUpdate);
});


async function updateTodayTabRecord(updateOperation) {
    log('Updating tab record...')
    const operationType = updateOperation(0) === 1 ? '+' : '-';
    log(`Operation type: ${operationType}`, 1);
    let { tabRecord, totalCount } = await chrome.storage.local.get(["tabRecord", "totalCount"]);
    log('Got current stored data:', 1, { tabRecord, totalCount });
    let newTabRecord = updateOperation(tabRecord);
    log(`Calculated new tab record: ${newTabRecord}`, 1);
    updateBadge(newTabRecord);
    log('Updated badge', 1);
    chrome.storage.local.set({ "tabRecord": newTabRecord, "totalCount": updateOperation(totalCount) });
    log('Updated storage', 1)
    plannedRecordUpdate = 0;
    timeout = null;
    log('Reset planned record update');
    log('Finished updating tab record');
}


function updateBadge(newRecord) {
    // Determine color
    let color;
    if (newRecord < 0) {
        color = COLOR_POSITIVE_COUNT;
    } else if (newRecord > 0) {
        color = COLOR_NEGATIVE_COUNT;
    } else {  // if color == 0
        color = COLOR_NEUTRAL;
    }

    // Determine badge text
    let text = newRecord.toString();
    if (newRecord > 0) {
        text = '+' + text;
    }

    // Make sure the badge text has a max length of 4 characters (-> 1 sign, 3 digits)
    if (newRecord > 999) {
        text = '+999';
    } else if (newRecord < -999) {
        text = '-999';
    }

    // Set new background color and text
    chrome.action.setBadgeBackgroundColor({ "color": color });
    chrome.action.setBadgeText({ "text": text });
}


function DEBUG_SET_RECORD(number) {
    chrome.storage.local.set({ "tabRecord": number });
    updateBadge(number);
}


function DEBUG_GET_TIME() {
    let today = new Date();
    return today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
}
