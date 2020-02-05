const locationsToFilterState = {};
const measuresToFilterState = {};
const datesToFilterState = {};
const includeZerosState = {};

const filtering = (id,
    { locations, measures, dates,
        locationsToFilter, measuresToFilter, datesToFilter,
        onChange, onSubmit }) => {
    locationsToFilterState[id] = [...locationsToFilter];
    measuresToFilterState[id] = [...measuresToFilter];
    datesToFilterState[id] = datesToFilter;
    includeZerosState[id] = true;

    const filtersDiv = document.querySelector(id);

    filtersDiv.appendChild(htmlToElement(`<h1 class="title is-spaced">Filtering</h1>`));

    filtersDiv.appendChild(htmlToElement(`<h2 class="subtitle is-spaced">Include readings with 0 value</h2>`));

    const includeZerosElement = htmlToElement(`<div class="content">
        <label class="radio">
        <input type="radio" name="includeZeros" value="true" checked>
        Yes
        </label>
        <label class="radio">
        <input type="radio" name="includeZeros" value="false">
        No
        </label>
    </div>`);
    includeZerosElement.querySelectorAll("input").forEach(input => {
        input.addEventListener("change", () => {
            console.log("Changing include zeros to", input.value);
            includeZerosState[id] = input.value === 'true';
            onChange();
        });
    })

    filtersDiv.appendChild(includeZerosElement);

    filtersDiv.appendChild(htmlToElement(`<h2 class="subtitle is-spaced">Start date</h2>`));

    const dateStartElement = htmlToElement(`<div class="content"><input class="input" type="number" value="${datesToFilter.start.year()}" min="${dates[0].year()}" max="${dates[dates.length - 1].year()}"></div>`);
    dateStartElement.querySelector("input").addEventListener('change', () => {
        console.log("Changing start date to", '01-01-' + dateStartElement.querySelector("input").value);
        datesToFilterState[id].start = moment('01-01-' + dateStartElement.querySelector("input").value, "DD-MM-YYYY");
        onChange();
    });
    filtersDiv.appendChild(dateStartElement);

    filtersDiv.appendChild(htmlToElement(`<h2 class="subtitle is-spaced">End date</h2>`));

    const dateEndElement = htmlToElement(`<div class="content"><input class="input" type="number" value="${datesToFilter.end.year()}" min="${dates[0].year()}" max="${dates[dates.length - 1].year()}"></div>`);
    dateEndElement.querySelector("input").addEventListener('change', () => {
        console.log("Changing end date to", '31-12-' + dateEndElement.querySelector("input").value);
        datesToFilterState[id].end = moment('31-12-' + dateEndElement.querySelector("input").value, "DD-MM-YYYY");
        onChange();
    });
    filtersDiv.appendChild(dateEndElement);

    filtersDiv.appendChild(htmlToElement(`<h2 class="subtitle is-spaced">Locations</h2>`));

    const selectAllLocations = htmlToElement("<span><a>select all</a></span>");
    const deselectAllLocations = htmlToElement("<span><a>deselect all</a></span>");
    const selectAllLocationsDiv = htmlToElement("<div></div");
    selectAllLocationsDiv.appendChild(selectAllLocations);
    selectAllLocationsDiv.appendChild(htmlToElement("<span> / </span>"));
    selectAllLocationsDiv.appendChild(deselectAllLocations);
    filtersDiv.appendChild(selectAllLocationsDiv);

    const locationsDiv = htmlToElement('<div class="content"></div>');

    locations.forEach(location => {
        const filterElement = htmlToElement(`<div><label class="checkbox"><input type="checkbox">${location}</label></div>`);
        filterElement.querySelector("input").checked = locationsToFilterState[id].filter(locationToFilter => locationToFilter === location).length > 0;
        filterElement.querySelector("input").addEventListener("change", () => {
            if (filterElement.querySelector("input").checked) {
                locationsToFilterState[id].push(location);
            } else {
                locationsToFilterState[id] = locationsToFilterState[id].filter(locationToFilter => locationToFilter != location);
            }
            onChange();
        });
        locationsDiv.appendChild(filterElement);
    });
    filtersDiv.appendChild(locationsDiv);

    selectAllLocations.querySelector("a").addEventListener("click", () => {
        locationsDiv.querySelectorAll("input").forEach(input => {
            input.checked = true;
        });
        locationsToFilterState[id] = [...locations];
    });
    deselectAllLocations.querySelector("a").addEventListener("click", () => {
        locationsDiv.querySelectorAll("input").forEach(input => {
            input.checked = false;
        });
        locationsToFilterState[id] = [];
    });

    filtersDiv.appendChild(htmlToElement(`<h2 class="subtitle is-spaced">Measurements</h2>`));

    const selectAllMeasures = htmlToElement("<span><a>select all</a> </span>");
    const deselectAllMeasures = htmlToElement("<span><a>deselect all</a></span>");
    const selectAllMeasuresDiv = htmlToElement("<div></div");
    selectAllMeasuresDiv.appendChild(selectAllMeasures);
    selectAllMeasuresDiv.appendChild(htmlToElement("<span> / </span>"));
    selectAllMeasuresDiv.appendChild(deselectAllMeasures);
    filtersDiv.appendChild(selectAllMeasuresDiv);

    const measuresDiv = htmlToElement('<div class="content"></div>');

    measures.forEach(measure => {
        const filterElement = htmlToElement(`<div><label class="checkbox"><input type="checkbox" name="${measure}">${measure}</label></div>`);
        filterElement.querySelector("input").checked = measuresToFilterState[id].filter(measureToFilter => measureToFilter === measure).length > 0;
        filterElement.querySelector("input").addEventListener("change", () => {
            if (filterElement.querySelector("input").checked) {
                measuresToFilterState[id].push(measure);
            } else {
                measuresToFilterState[id] = measuresToFilterState[id].filter(measureToFilter => measureToFilter != measure);
            }
            onChange();
        });
        measuresDiv.appendChild(filterElement);
    });
    filtersDiv.appendChild(measuresDiv);

    selectAllMeasures.querySelector("a").addEventListener("click", () => {
        measuresDiv.querySelectorAll("input").forEach(input => {
            input.checked = true;
        });
        measuresToFilterState[id] = [...measures];
    });
    deselectAllMeasures.querySelector("a").addEventListener("click", () => {
        measuresDiv.querySelectorAll("input").forEach(input => {
            input.checked = false;
        });
        measuresToFilterState[id] = [];
    });
};

const addMeasureToSelection = (id, measure) => {
    measuresToFilterState[id].push(measure);
    document.querySelector(id).querySelector(`input[name="${measure}"]`).checked = true;
};

const removeMeasureFromSelection = (id, measure) => {
    measuresToFilterState[id] = measuresToFilterState[id].filter(measureToFilter => measureToFilter != measure);
    document.querySelector(id).querySelector(`input[name="${measure}"]`).checked = false;
}

const filteringState = (id) => {
    return {
        locations: locationsToFilterState[id],
        measures: measuresToFilterState[id],
        dates: datesToFilterState[id],
        includeZeros: includeZerosState[id]
    }
};