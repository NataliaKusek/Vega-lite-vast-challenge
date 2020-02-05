const extractLocationsCoordinatesFromTopoJson = (topojson) => {
    const locationsCoordinates = {};

    const scaleX = topojson.transform.scale[0];
    const scaleY = topojson.transform.scale[1];
    const translateX = topojson.transform.translate[0];
    const translateY = topojson.transform.translate[1];
    topojson.objects.Points.geometries.forEach(geometry => {
        locationsCoordinates[geometry.properties.id] = {
            x: geometry.coordinates[0] * scaleX + translateX,
            y: geometry.coordinates[1] * scaleY + translateY
        }
    });

    return locationsCoordinates;
};

const parseReadingsCsv = (csv, locationsCoordinates) => {
    // CSV format: id,value,location,sample date,measure
    const parsedReadings = Papa.parse(readings, { delimiter: ",", header: true }).data;
    parsedReadings.forEach(reading => {
        reading['x'] = locationsCoordinates[reading['location']].x;
        reading['y'] = locationsCoordinates[reading['location']].y;
        reading['date'] = moment(reading['sample date'], "DD-MMM-YY");
    });

    return parsedReadings;
}

const extractLocations = (parsedReadings) => [...new Set(parsedReadings.map(reading => reading['location']))].sort();
const extractMeasures = (parsedReadings) => [...new Set(parsedReadings.map(reading => reading['measure']))].sort();
const extractDates = (parsedReadings) => parsedReadings.map(reading => reading['date']).sort((x, y) => x.valueOf() - y.valueOf());

const printCsvReadings = (parsedReadings) => {
    const csvReadingsLines = parsedReadings
        .map(reading => {
            return `${reading.id},${reading.value},${reading.location},${reading.x},${reading.y},${reading.date.format("YYYY-MM-DD")},${reading.date.format("dddd")},${reading.date.format("Qo")},"${reading.measure}"`;
        });
    csvReadingsLines.unshift("id,value,location,x,y,date,dayOfWeek,quarter,measure");

    return csvReadingsLines.join('\n');
}

const filterReadings = (parsedReadings, filteringState) => parsedReadings
    .filter(reading => filteringState.includeZeros || reading.value > 0)
    .filter(reading => reading.date.isSameOrAfter(filteringState.dates.start) && reading.date.isSameOrBefore(filteringState.dates.end))
    .filter(reading => containsString(filteringState.locations, reading['location']))
    .filter(reading => containsString(filteringState.measures, reading['measure']));

const filterReadingsForMeasures = (parsedReadings, measures) => parsedReadings
    .filter(reading => containsString(measures, reading['measure']));

const submitButton = (id, { onSubmit }) => {
    const submitButton = htmlToElement(`<div class="content"><button class="button is-link">Submit</button></div>`);
    submitButton.addEventListener("click", () => {
        onSubmit();
    });
    document.querySelector(id).appendChild(submitButton);
}

/****
 * 
 * Loading
 * 
 */
const finishInitialLoading = (modalId) => {
    const modalElement = document.querySelector(modalId);
    modalElement.classList.remove("is-active");
};

const showProgressBar = (id) => {
    document.querySelector(id).classList.remove("is-hidden");
}

const hideProgressBar = (id) => {
    document.querySelector(id).classList.add("is-hidden");
}

/****
 * 
 *  Misc 
 * 
 */
const containsString = (array, element) => array.filter(arrayElement => arrayElement === element).length > 0;

const htmlToElement = (html) => {
    const template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}