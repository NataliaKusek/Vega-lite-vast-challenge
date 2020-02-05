// 'map' and 'readings' variables are defined in js/data.js
// functions are definded in js/functions.js
initNavBar();

const locationsCoordinates = extractLocationsCoordinatesFromTopoJson(JSON.parse(map));
console.log("Locations coordinates", locationsCoordinates);

const parsedReadings = parseReadingsCsv(readings, locationsCoordinates);
console.log("Parsed readings", parsedReadings);

const locations = extractLocations(parsedReadings);
const measures = extractMeasures(parsedReadings);
const dates = extractDates(parsedReadings);

console.log("Locations", locations);
console.log("Measures", measures);
console.log("First date", dates[0], "Last date", dates[dates.length - 1]);

const filteredReadings = () => filterReadings(parsedReadings, filteringState("#filters"));

submitButton("#submit", {
    onSubmit: () => {
        console.log("Submitted", optionsState("#options"), filteringState("#filters"));
        const currentFilteredReadings = filteredReadings();
        const currentMeasures = extractMeasures(currentFilteredReadings)
        renderDetailsSelection(currentMeasures);
        renderComparisonSelection(currentMeasures);
        paintDetails(filterReadingsForMeasures(currentFilteredReadings, selectionState("#selection-details").measures), optionsState("#options"));
        paintComparison(filterReadingsForMeasures(currentFilteredReadings, selectionState("#selection-comparison").measures), optionsState("#options"));
        paintOverview(currentFilteredReadings, {
            ...optionsState("#options"),
            onMeasureSelected: (selectedMeasure) => {
                console.log("Measure selected", selectedMeasure);
                addMeasureToSelection("#filters", selectedMeasure);
            },
            onMeasureUnselected: (unselectedMeasure) => {
                console.log("Measure unselected", unselectedMeasure);
                removeMeasureFromSelection("#filters", unselectedMeasure);
            }
        });
    }
})

options("#options", {
    onChange: () => {
        console.log("Options changed", optionsState("#options"));
    }
});
console.log("Options state", optionsState("#options"));

filtering("#filters", {
    locations: locations, measures: measures, dates: dates,
    locationsToFilter: locations, measuresToFilter: measures, datesToFilter: {
        start: dates[0],
        end: dates[dates.length - 1]
    },
    onChange: () => {
        console.log("Filter changed", filteringState("#filters"));
    },
});
console.log("Filtering state", filteringState("#filters"));

const renderDetailsSelection = (measures) => selection("#selection-details", {
    singleSelection: true,
    measures: measures,
    selectedMeasures: [measures[0]],
    onChange: () => {
        console.log("Selection changed", selectionState("#selection-details"));
        paintDetails(filterReadingsForMeasures(filteredReadings(), selectionState("#selection-details").measures), optionsState("#options"));
    }
});
submitButton("#submit-comparison", {
    onSubmit: () => {
        console.log("Selection submitted", selectionState("#selection-comparison"));
        paintComparison(filterReadingsForMeasures(filteredReadings(), selectionState("#selection-comparison").measures), optionsState("#options"));
    }
});
const renderComparisonSelection = (measures) => selection("#selection-comparison", {
    singleSelection: false,
    measures: measures,
    selectedMeasures: measures.slice(0, Math.min(measures.length, 5)),
    onChange: () => {
        console.log("Selection changed", selectionState("#selection-comparison"));
    }
});

const initialFilteredReadings = filteredReadings();

paintOverview(initialFilteredReadings, {
    ...optionsState("#options"),
    onMeasureSelected: (selectedMeasure) => {
        console.log("Measure selected", selectedMeasure);
        addMeasureToSelection("#filters", selectedMeasure);
    },
    onMeasureUnselected: (unselectedMeasure) => {
        console.log("Measure unselected", unselectedMeasure);
        removeMeasureFromSelection("#filters", unselectedMeasure);
    }
});

const initialMeasures = extractMeasures(initialFilteredReadings);
renderDetailsSelection(initialMeasures);
console.log("Details selection state", selectionState("#selection-details"));
paintDetails(filterReadingsForMeasures(initialFilteredReadings, selectionState("#selection-details").measures), optionsState("#options"));

renderComparisonSelection(initialMeasures);
console.log("Comparison selection state", selectionState("#selection-comparison"));
paintComparison(filterReadingsForMeasures(initialFilteredReadings, selectionState("#selection-comparison").measures), optionsState("#options"));

paintQuestions(parsedReadings);

finishInitialLoading("#initial-loading-modal");