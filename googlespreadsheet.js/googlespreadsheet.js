function dailyTaskSheet() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const today = new Date();
    const todayName = Utilities.formatDate(today, Session.getScriptTimeZone(), "MMMM d, yyyy");

    if (spreadsheet.getSheetByName(todayName)) {
        Logger.log(`Today's sheet (${todayName}) already exists.`);
        return;
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayName = Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "MMMM d, yyyy");

    const previousSheet = spreadsheet.getSheetByName(yesterdayName);
    if (!previousSheet) {
        Logger.log(`Yesterday's sheet (${yesterdayName}) not found.`);
        return;
    }

    const newSheet = spreadsheet.insertSheet(todayName);
    if (!newSheet) {
        Logger.log("Failed to create new sheet.");
        return;
    }

    Logger.log(`New sheet created: ${newSheet.getName()}`);

    // Copy formatting and data
    const sourceRange = previousSheet.getRange(1, 1, previousSheet.getMaxRows(), previousSheet.getMaxColumns());
    sourceRange.copyTo(newSheet.getRange(1, 1), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);

    // Copy headers and filtered data
    const headerRange = previousSheet.getRange(1, 1, 1, previousSheet.getLastColumn());
    newSheet.getRange(1, 1, 1, headerRange.getNumColumns()).setValues(headerRange.getValues());

    const dataRange = previousSheet.getRange(2, 1, previousSheet.getLastRow() - 1, previousSheet.getLastColumn());
    const data = dataRange.getValues();
    const filteredData = data.filter(row => row[3] !== "DONE");
    if (filteredData.length > 0) {
        newSheet.getRange(2, 1, filteredData.length, filteredData[0].length).setValues(filteredData);
    }

    // Apply dropdowns
    applyDropdowns(newSheet);

    // Adjust column widths (choose static or dynamic)
    autoFitColumnWidths(newSheet); // Dynamic option

    Logger.log(`Sheet "${todayName}" created successfully.`);
    sortSheetLabels(newSheet);
}


function onEdit(e) {
    const sheet = e.source.getActiveSheet();
    if (!sheet || !sheet.getName().includes("Tasks")) {
        Logger.log("Edit occurred on a non-task sheet. Skipping.");
        return;
    }

    if (e.authMode === ScriptApp.AuthMode.NONE) {
        Logger.log(`Manual edit detected in sheet: ${sheet.getName()}`);
        sortSheetLabels(sheet);
    } else {
        Logger.log("Script-initiated edit detected. Ignoring.");
    }
}

function sortSheetLabels(sheet) {
    if (!sheet) {
        Logger.log("Error: Invalid sheet object passed to sortSheetLabels.");
        return;
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
        Logger.log("No data to sort. Exiting.");
        return;
    }

    const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const data = range.getValues();

    const taskOrder = ["9-5_WORK", "PERSONAL_WORK", "WORK_PROJECT", "MEETING"];
    const priorityOrder = ["DO IT NOW!", "HIGH", "MEDIUM", "LOW", "ZZZ_DONE"];
    const statusOrder = ["IN_PROGRESS", "NOT_STARTED", "BLOCKED", "DONE", "MEETING"];

    data.sort((a, b) => {
        const taskDiff = taskOrder.indexOf(a[0]) - taskOrder.indexOf(b[0]);
        if (taskDiff !== 0) return taskDiff;

        const priorityDiff = priorityOrder.indexOf(a[2]) - priorityOrder.indexOf(b[2]);
        if (priorityDiff !== 0) return priorityDiff;

        const statusDiff = statusOrder.indexOf(a[3]) - statusOrder.indexOf(b[3]);
        if (statusDiff !== 0) return statusDiff;

        return 0;
    });

    range.setValues(data);
    Logger.log("Sorting completed successfully.");
}

function applyDropdowns(sheet) {
    const taskTypes = ["9-5_WORK", "PERSONAL_WORK", "WORK_PROJECT", "MEETING"];
    const priorities = ["DO IT NOW!", "HIGH", "MEDIUM", "LOW", "ZZZ_DONE"];
    const statuses = ["IN_PROGRESS", "NOT_STARTED", "DONE", "BLOCKED", "MEETING"];

    const lastRow = sheet.getMaxRows(); // Adjust for entire column
    const validationBuilder = SpreadsheetApp.newDataValidation();

    // Apply dropdown for Task Types (Column A)
    const taskValidation = validationBuilder
        .requireValueInList(taskTypes, true)
        .setAllowInvalid(false)
        .build();
    sheet.getRange(2, 1, lastRow - 1).setDataValidation(taskValidation); // Column A (Rows 2 onward)

    // Apply dropdown for Priorities (Column C)
    const priorityValidation = validationBuilder
        .requireValueInList(priorities, true)
        .setAllowInvalid(false)
        .build();
    sheet.getRange(2, 3, lastRow - 1).setDataValidation(priorityValidation); // Column C (Rows 2 onward)

    // Apply dropdown for Statuses (Column D)
    const statusValidation = validationBuilder
        .requireValueInList(statuses, true)
        .setAllowInvalid(false)
        .build();
    sheet.getRange(2, 4, lastRow - 1).setDataValidation(statusValidation); // Column D (Rows 2 onward)

    Logger.log("Dropdown menus applied successfully.");
}


function autoFitColumnWidths(sheet) {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    for (let col = 1; col <= lastCol; col++) {
        const columnValues = sheet.getRange(1, col, lastRow).getValues();
        let maxTextLength = 0;

        columnValues.forEach(row => {
            if (row[0] && row[0].toString().length > maxTextLength) {
                maxTextLength = row[0].toString().length;
            }
        });

        // Dynamically set column width based on text length (10px per character approx.)
        const newWidth = Math.max(maxTextLength * 10, 50); // Minimum width = 50px
        sheet.setColumnWidth(col, newWidth);
        Logger.log(`Column ${col} width adjusted to ${newWidth}px.`);
    }
}