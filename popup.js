const COLOR_POSITIVE_COUNT = "#7bd96a";
const COLOR_NEGATIVE_COUNT = "#ed5342";
const COLOR_NEUTRAL = "#969696";


window.onload = async function(e) {
    // Get stored data and current tab count
    let promises = [
        chrome.storage.local.get(["tabRecord", "last6Records", "last6Totals"]),
        chrome.tabs.query({})
    ]
    let [storedData, tabs] = await Promise.all(promises);
    let currentTabCount = tabs.length;
    let { tabRecord, last6Records, last6Totals } = storedData;

    // Set total tab count
    document.getElementById('total').innerText = currentTabCount;


    // Calculate 7-day statistics

    // How many tabs were closed/opened on average over the last 7 days (including today)
    dailyTabRecordSum = tabRecord + last6Records.reduce((a, b) => a+b)
    avgDailyTabRecord = dailyTabRecordSum / 7;

    // Difference between today's tab count and the tab count 6 days ago (in %)
    total7DayChange = currentTabCount - last6Totals.at(-1);    // Absolute difference
    weekChangePercent = (total7DayChange / last6Totals.at(-1)) * 100;


    // Display 7-day statistics

    // Convert numbers to properly formatted strings
    strAvgDailyTabRecord = formatNumberSign(avgDailyTabRecord.toFixed(2));
    strWeekChangePercent = formatNumberSign(weekChangePercent.toFixed(2));

    // Get html elements
    elemDailyAvg = document.getElementById('dailyAvg');
    elemWeekPercentage = document.getElementById('weekPercentage');

    // Change inner Text
    elemDailyAvg.innerText = strAvgDailyTabRecord + ' tabs';
    elemWeekPercentage.innerText = strWeekChangePercent + ' %';

    // Update colors
    updateNumberColor(elemDailyAvg);
    updateNumberColor(elemWeekPercentage);
}


function formatNumberSign(number) {
    if (number > 0) {
        return '+' + number;
    } else {
        return number;
    }
}


function updateNumberColor(htmlElement) {
    let color;

    let firstChar = htmlElement.innerText.charAt(0)
    if (firstChar === '+') {  // if positive number
        color = COLOR_NEGATIVE_COUNT;
    } else if (firstChar === '-') {  // if negeative number
        color = COLOR_POSITIVE_COUNT;
    } else {  // if zero
        color = COLOR_NEUTRAL;
    }

    htmlElement.style.color = color;
}
