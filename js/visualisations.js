const finalizers = {};

function addFinalizer(id, finalizer) {
    if (!finalizers[id]) {
        finalizers[id] = [];
    }
    finalizers[id].push(finalizer);
}

function executeFinalizers(id) {
    while (finalizers[id] && finalizers[id].length > 0) {
        console.log("Executing finalizer for", id);
        finalizers[id].pop()();
    }
}

function paintVega(id, spec) {
    executeFinalizers(id);
    console.log("Painting", id, spec);
    return vegaEmbed(id, spec).then(({ spec, view, vgSpec, finalize }) => {
        addFinalizer(id, () => {
            finalize();
        })
        return { spec, view, vgSpec, finalize };
    });
}

function paintOverview(readings, { onMeasureSelected, onMeasureUnselected, scale }) {
    const csvReadings = printCsvReadings(readings);
    const locations = extractLocations(readings);
    const measures = extractMeasures(readings);

    paintVega('#visNumberOfReadingsOverall', vlSpecNumberOfReadingsOverall(csvReadings));
    paintVega('#visNumberOfReadingsMap', vlSpecNumberOfReadingsMap(map, csvReadings));
    paintVega('#visReadingsPerYear', vlSpecReadingsPerYear(csvReadings, locations.length));
    paintVega('#visNumberOfReadingsTable', vlSpecNumberOfReadingsTable(csvReadings, measures.length)).then(({ spec, view }) => {
        view.addEventListener('click', (event, item) => {
            if (event.shiftKey) {
                console.log("Unselected item", item);
                onMeasureUnselected(item.datum.measure);
            }
            if (event.ctrlKey) {
                console.log("Selected item", item);
                onMeasureSelected(item.datum.measure);
            }
        });
    });
    paintVega('#visMeasuresValuesOverYears', vlSpecMeasuresValuesOverYears(csvReadings, scale)).then(({ spec, view }) => {
        view.addEventListener('click', (event, item) => {
            if (event.shiftKey) {
                console.log("Unselected item", item);
                onMeasureUnselected(item.datum.measure);
            }
            if (event.ctrlKey) {
                console.log("Selected item", item);
                onMeasureSelected(item.datum.measure);
            }
        });
    });
}

function paintDetails(readings, { scale }) {
    const csvReadings = printCsvReadings(readings);
    const locations = extractLocations(readings);

    paintVega('#visMeasureValuesOnMap', vlSpecMeasureValuesOnMap(map, csvReadings));
    paintVega('#visMeasureValuesOverYears', vlSpecMeasureValuesOverYears(csvReadings, scale));
    paintVega('#visMeasureValuesPerMonth', vlSpecMeasurePerMonth(csvReadings, scale));
    paintVega('#visMeasureValuesVariance', vlSpecMeasureVariance(csvReadings, locations.length));
}

function paintComparison(readings, { scale }) {
    const csvReadings = printCsvReadings(readings);

    paintVega('#visNumberOfReadingsComparisonMap', vlSpecNumberOfReadingsMap(map, csvReadings));
    paintVega('#visMeasureValuesComparisonOverYears', vlSpecMeasureValuesComparisonOverYears(csvReadings, scale));
}

function paintQuestions(readings) {
    const csvReadings = printCsvReadings(readings);

    paintVega('#visQ1descreasingValuesLead', vlSpecQ1descreasingValues(csvReadings, "Lead", 2003, 2008));
    paintVega('#visQ1descreasingValuesChromium', vlSpecQ1descreasingValues(csvReadings, "Chromium", 2003, 2013));
    paintVega('#visQ1chlorodinineMethylosmoline', vlSpecQ1chlorodinineMethylosmoline(map, csvReadings));

    paintVega('#visQ2calciumMagnesium', vlSpecQ2calciumMagnesium(map, csvReadings));
    paintVega('#visQ2aug15', vlSpecQ2aug15(csvReadings));
    paintVega('#visQ2sampling', vlSpecQ2sampling(map, csvReadings));

    paintVega('#visQ3methylosmoline', vlSpecQ3methylosmoline(map, csvReadings));
    paintVega('#visQ3arsenic', vlSpecQ3arsenic(map, csvReadings));
    paintVega('#visQ3cod', vlSpecQ3cod(map, csvReadings));
}

const vlSpecNumberOfReadingsOverall = (csvReadings) => {
    return {
        datasets: {
            readings: csvReadings
        },
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        data: { name: "readings", format: { type: "csv" } },
        "transform": [
            { "timeUnit": "yearmonth", "field": "date", "as": "yearmonth" },
            {
                "aggregate": [{ "op": "count", "as": "num_readings" }],
                "groupby": ["location", "yearmonth"]
            }
        ],
        "facet": {
            "row": {
                "field": "location",
                "type": "nominal",
                "sort": { "field": "num_readings", "order": "descending" }
            }
        },
        spec: {
            width: 1000,
            height: 100,
            mark: { type: "area" },
            "encoding": {
                "x": {
                    "field": "yearmonth",
                    "type": "temporal"
                },
                "y": {
                    "field": "num_readings",
                    "type": "quantitative",
                    "title": "Number of readings"
                },
                "color": {
                    "field": "location",
                    "type": "nominal"
                },
                "tooltip": [
                    { "field": "location", "type": "nominal" },
                    { "field": "num_readings", "type": "quantitative", "title": "Number of readings" }
                ]
            }
        }
    }
};

const vlSpecNumberOfReadingsMap = (map, csvReadings) => {
    return {
        datasets: {
            areas: map,
            rivers: map,
            points: map,
            readings: csvReadings
        },
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        width: 1000,
        height: 800,
        resolve: { scale: { color: "independent" } },
        layer: [
            {
                data: { name: "areas", format: { type: "topojson", feature: "Areas" } },
                mark: {
                    type: "geoshape"
                },
                encoding: {
                    "color": {
                        "field": "properties.id",
                        "type": "nominal",
                        "title": "River area"
                    },
                    "opacity": {
                        "value": 0.15
                    }
                }
            },
            {
                data: { name: "points", format: { type: "topojson", feature: "Points" } },
                mark: {
                    type: "geoshape"
                },
                encoding: {
                    "color": {
                        "field": "properties.id",
                        "type": "nominal",
                        "title": "Location"
                    }
                }
            },
            {
                data: { name: "rivers", format: { type: "topojson", feature: "Rivers" } },
                mark: {
                    type: "geoshape",
                    filled: false,
                },
                encoding: {
                    "color": {
                        "field": "properties.id",
                        "type": "nominal",
                        "title": "River"
                    }
                }
            },
            {
                data: { name: "readings", format: { type: "csv" } },
                mark: {
                    type: "point"
                },
                "encoding": {
                    "longitude": {
                        "field": "x",
                        "type": "quantitative"
                    },
                    "latitude": {
                        "field": "y",
                        "type": "quantitative"
                    },
                    "size": {
                        "field": "value",
                        "type": "quantitative",
                        aggregate: "count",
                        scale: { range: [0, 5000] },
                        "title": "Total number of readings"
                    },
                    "tooltip": { "field": "value", aggregate: "count", "type": "quantitative" }
                }
            },
            {
                data: { name: "readings", format: { type: "csv" } },
                mark: {
                    type: "text",
                    "dy": -15
                },
                "encoding": {
                    "longitude": {
                        "field": "x",
                        "type": "quantitative"
                    },
                    "latitude": {
                        "field": "y",
                        "type": "quantitative"
                    },
                    "text": { "field": "location", "type": "nominal" }
                }
            }
        ]
    }
};

const vlSpecNumberOfReadingsTable = (csvReadings, numberOfMeasures) => {
    return {
        datasets: {
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        data: { name: "readings", format: { type: "csv" } },
        width: 800,
        height: numberOfMeasures * 20 + 50,
        "transform": [
            {
                "aggregate": [{ "op": "count", "as": "num_readings" }],
                "groupby": ["location", "measure"]
            }
        ],
        "encoding": {
            "x": { "field": "location", "type": "nominal", "sort": { "field": "num_readings", "order": "descending" } },
            "y": { "field": "measure", "type": "nominal", "sort": { "field": "num_readings", "order": "descending" } }
        },
        "layer": [
            {
                "mark": "rect",
                "encoding": {
                    "color": {
                        "field": "num_readings",
                        "type": "quantitative",
                        "title": "Count of Readings",
                        "legend": { "direction": "horizontal", "gradientLength": 120 }
                    }
                }
            },
            {
                "mark": "text",
                "encoding": {
                    "text": { "field": "num_readings", "type": "quantitative" },
                    "color": {
                        "condition": { "test": "datum['num_readings'] < 600", "value": "black" },
                        "value": "white"
                    }
                }
            }
        ],
        "config": {
            "scale": { "bandPaddingInner": 0, "bandPaddingOuter": 0 },
            "text": { "baseline": "middle" }
        }
    }
};

const vlSpecReadingsPerYear = (csvReadings, numberOfLocations) => {
    return {
        datasets: {
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        data: { name: "readings", format: { type: "csv" } },
        width: 800 / numberOfLocations,
        height: 100,
        "mark": { "type": "line", "tooltip": true },
        "encoding": {
            "column": { "field": "location", "type": "nominal" },
            "x": { "field": "date", "type": "temporal", "timeUnit": "year" },
            "y": { "field": "value", "aggregate": "count", "type": "quantitative" },
            color: { field: "location", type: "nominal" }
        }
    }
};

const vlSpecMeasuresValuesOverYears = (csvReadings, scale) => {
    return {
        datasets: {
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        data: { name: "readings", format: { type: "csv" } },
        width: 1000,
        height: 100,
        "mark": { "type": "circle", "tooltip": true },
        "encoding": {
            "facet": { "field": "measure", "type": "nominal", "columns": 1 },
            "x": { "field": "date", "type": "temporal" },
            "y": { "field": "value", "type": "quantitative", "scale": { "type": scale } },
            color: { field: "location", type: "nominal" }
        },
        resolve: { scale: { y: "independent" }, axis: { x: "independent" } },
    }
};

const vlSpecMeasureValuesOverYears = (csvReadings, scale) => {
    return {
        datasets: {
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        data: { name: "readings", format: { type: "csv" } },
        "facet": { "row": { "field": "location", "type": "nominal" } },
        spec: {
            width: 1000,
            height: 250,
            layer: [
                {
                    "selection": {
                        "label": {
                            "type": "interval",
                            "encodings": ["x"],
                            bind: "scales"
                        }
                    },
                    "mark": { "type": "circle", "tooltip": true },
                    "encoding": {
                        "x": { "field": "date", "type": "temporal" },
                        "y": { "field": "value", "type": "quantitative", "scale": { "type": scale } },
                        color: { field: "location", type: "nominal" }
                    },
                },
                {
                    "mark": { "type": "line" },
                    "encoding": {
                        "x": {
                            "field": "date",
                            "type": "temporal"
                        },
                        "y": {
                            "field": "value",
                            "type": "quantitative",
                            "axis": { "title": "Median value" }
                        },
                        color: { field: "location", type: "nominal" }
                    }
                }
            ]
        }
    }
};

const vlSpecMeasurePerMonth = (csvReadings, scale) => {
    return {
        datasets: {
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        data: { name: "readings", format: { type: "csv" } },
        width: 70,
        height: 500,
        "transform": [
            { "timeUnit": "month", "field": "date", "as": "month" }
        ],
        "mark": { "type": "circle", "tooltip": true },
        "encoding": {
            "column": { "field": "month", "type": "temporal", "timeUnit": "month" },
            "x": { "field": "date", "type": "temporal" },
            "y": { "field": "value", "type": "quantitative", "scale": { "type": scale } },
            color: { field: "location", type: "nominal" }
        }
    }
};

const vlSpecMeasureVariance = (csvReadings, numberOfLocations) => {
    return {
        datasets: {
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        data: { name: "readings", format: { type: "csv" } },
        width: 1000,
        height: numberOfLocations * 30,
        "mark": { "type": "boxplot" },
        "encoding": {
            "y": { "field": "location", "type": "nominal" },
            "x": { "field": "value", "type": "quantitative" },
            color: { field: "location", type: "nominal" },
            "tooltip": [
                { "field": "date", "type": "temporal" },
                { "field": "value", "type": "quantitative" },
                { "field": "location", "type": "nominal" }
            ]
        }
    }
};

const vlSpecMeasureValuesOnMap = (map, csvReadings) => {
    return {
        datasets: {
            areas: map,
            rivers: map,
            points: map,
            readings: csvReadings
        },
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        width: 1000,
        height: 800,
        resolve: { scale: { color: "independent" } },
        layer: [
            {
                data: { name: "areas", format: { type: "topojson", feature: "Areas" } },
                mark: {
                    type: "geoshape"
                },
                encoding: {
                    "color": {
                        "field": "properties.id",
                        "type": "nominal",
                        "title": "River area"
                    },
                    "opacity": {
                        "value": 0.15
                    }
                }
            },
            {
                data: { name: "points", format: { type: "topojson", feature: "Points" } },
                mark: {
                    type: "geoshape"
                },
                encoding: {
                    "color": {
                        "field": "properties.id",
                        "type": "nominal",
                        "title": "Location"
                    }
                }
            },
            {
                data: { name: "rivers", format: { type: "topojson", feature: "Rivers" } },
                mark: {
                    type: "geoshape",
                    filled: false,
                },
                encoding: {
                    "color": {
                        "field": "properties.id",
                        "type": "nominal",
                        "title": "River"
                    }
                }
            },
            {
                data: { name: "readings", format: { type: "csv" } },
                mark: {
                    type: "point",
                    shape: "square"
                },
                "encoding": {
                    "longitude": {
                        "field": "x",
                        "type": "quantitative"
                    },
                    "latitude": {
                        "field": "y",
                        "type": "quantitative"
                    },
                    "size": {
                        "field": "value",
                        "type": "quantitative",
                        aggregate: "median",
                        scale: { range: [0, 5000] }
                    },
                    "tooltip": { "field": "value", aggregate: "median", "type": "quantitative" }
                }
            },
            {
                data: { name: "readings", format: { type: "csv" } },
                mark: {
                    type: "text",
                    "dy": -15
                },
                "encoding": {
                    "longitude": {
                        "field": "x",
                        "type": "quantitative"
                    },
                    "latitude": {
                        "field": "y",
                        "type": "quantitative"
                    },
                    "text": { "field": "location", "type": "nominal" }
                }
            }
        ]
    }
};

const vlSpecMeasureValuesComparisonOverYears = (csvReadings, scale) => {
    return {
        datasets: {
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        data: { name: "readings", format: { type: "csv" } },
        "facet": { "row": { "field": "measure", "type": "nominal" } },
        spec: {
            width: 1000,
            height: 250,
            layer: [
                {
                    "mark": { "type": "circle", "tooltip": true },
                    "encoding": {
                        "x": { "field": "date", "type": "temporal" },
                        "y": { "field": "value", "type": "quantitative", "scale": { "type": scale } },
                        color: { field: "location", type: "nominal" }
                    }
                },
                {
                    "mark": { "type": "line" },
                    "encoding": {
                        "x": {
                            "field": "date",
                            "type": "temporal"
                        },
                        "y": {
                            "field": "value",
                            "type": "quantitative"
                        },
                        color: { field: "location", type: "nominal" }
                    }
                }
            ]
        },
        resolve: { scale: { y: "independent" }, axis: { x: "independent" } }
    }
};

/****
 * Questions
 */

/*
* Question 1
*/

const vlSpecQ1descreasingValues = (csvReadings, measure, date1, date2) => {
    return {
        datasets: {
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        data: { name: "readings", format: { type: "csv" } },
        "transform": [
            { "timeUnit": "year", "field": "date", "as": "year" },
            { "filter": { "field": "measure", "equal": measure } },
            { "filter": { "field": "location", "oneOf": ["Boonsri", "Busarakhan", "Chai", "Kannika", "Kohsoom", "Sakda", "Somchair"] } }
        ],
        vconcat: [
            {
                "title": measure + " over years",
                width: 1000,
                height: 200,
                "mark": { "type": "line" },
                "encoding": {
                    "x": {
                        "field": "date",
                        "type": "temporal"
                    },
                    "y": {
                        "field": "value",
                        "type": "quantitative"
                    },
                    color: { field: "location", type: "nominal" },
                    "tooltip": [
                        { "field": "date", "type": "temporal" },
                        { "field": "value", "type": "quantitative" },
                        { "field": "location", "type": "nominal" }
                    ]
                }
            },
            {
                vconcat: [
                    {
                        "title": measure + " for years < " + date1,
                        width: 1000,
                        height: 200,
                        "transform": [
                            { "filter": { "field": "date", "lt": { "year": date1 } } }
                        ],
                        "mark": { "type": "boxplot" },
                        "encoding": {
                            "y": { "field": "location", "type": "nominal" },
                            "x": { "field": "value", "type": "quantitative" },
                            color: { field: "location", type: "nominal" },
                            "tooltip": [
                                { "field": "date", "type": "temporal" },
                                { "field": "value", "type": "quantitative" },
                                { "field": "location", "type": "nominal" }
                            ]
                        }
                    },
                    {
                        "title": measure + " for years " + date1 + " - " + date2,
                        width: 1000,
                        height: 200,
                        "transform": [
                            { "filter": { "field": "date", "gte": { "year": date1 } } },
                            { "filter": { "field": "date", "lt": { "year": date2 } } }
                        ],
                        "mark": { "type": "boxplot" },
                        "encoding": {
                            "y": { "field": "location", "type": "nominal" },
                            "x": { "field": "value", "type": "quantitative" },
                            color: { field: "location", type: "nominal" },
                            "tooltip": [
                                { "field": "date", "type": "temporal" },
                                { "field": "value", "type": "quantitative" },
                                { "field": "location", "type": "nominal" }
                            ]
                        }
                    },
                    {
                        "title": measure + " for years > " + date2,
                        width: 1000,
                        height: 210,
                        "transform": [
                            { "filter": { "field": "date", "gte": { "year": date2 } } }
                        ],
                        "mark": { "type": "boxplot" },
                        "encoding": {
                            "y": { "field": "location", "type": "nominal" },
                            "x": { "field": "value", "type": "quantitative" },
                            color: { field: "location", type: "nominal" },
                            "tooltip": [
                                { "field": "date", "type": "temporal" },
                                { "field": "value", "type": "quantitative" },
                                { "field": "location", "type": "nominal" }
                            ]
                        }
                    }
                ],
                "resolve": { "scale": { "x": "shared" } }
            }
        ]
    }
}

const vlSpecQ1chlorodinineMethylosmoline = (map, csvReadings) => {
    return {
        datasets: {
            areas: map,
            rivers: map,
            points: map,
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "title": {
            text: "Chlorodinine and Methylosmoline for years > 2014",
            anchor: "middle"
        },
        data: { name: "readings", format: { type: "csv" } },
        "transform": [
            { "filter": { "field": "value", "gt": 0 } },
            { "filter": { "field": "measure", "oneOf": ["Chlorodinine", "Methylosmoline"] } }
        ],
        hconcat: [
            {
                width: 400,
                height: 400,
                resolve: { scale: { color: "independent" } },
                layer: [
                    {
                        data: { name: "points", format: { type: "topojson", feature: "Points" } },
                        mark: {
                            type: "geoshape"
                        },
                        encoding: {
                            "detail": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "Location",
                                "legend": false
                            }
                        }
                    },
                    {
                        data: { name: "rivers", format: { type: "topojson", feature: "Rivers" } },
                        mark: {
                            type: "geoshape",
                            filled: false,
                        },
                        encoding: {
                            "color": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "River",
                                "legend": false
                            }
                        }
                    },
                    {
                        mark: {
                            type: "text",
                            "dy": -15
                        },
                        "selection": {
                            "location": {
                                "type": "multi", "fields": ["location"]
                            }
                        },
                        "encoding": {
                            "longitude": {
                                "field": "x",
                                "type": "quantitative"
                            },
                            "latitude": {
                                "field": "y",
                                "type": "quantitative"
                            },
                            "text": {
                                "field": "location",
                                "type": "nominal"
                            },
                            "color": {
                                "condition": {
                                    "selection": "location",
                                    "field": "location",
                                    "type": "nominal",
                                    "legend": false
                                },
                                "value": "grey"
                            }
                        }
                    }
                ]
            },
            {
                "facet": { "row": { "field": "measure", "type": "nominal" } },
                spec: {
                    width: 800,
                    height: 200,
                    layer: [
                        {
                            "mark": { "type": "circle", "tooltip": true },
                            "encoding": {
                                "x": { "field": "date", "type": "temporal" },
                                "y": { "field": "value", "type": "quantitative" },
                                color: { field: "location", type: "nominal" },
                                "opacity": {
                                    "condition": { "selection": "location", "value": 1 },
                                    "value": 0.2
                                }
                            }
                        },
                        {
                            "mark": { "type": "line" },
                            "selection": {
                                "location": {
                                    "type": "multi", "fields": ["location"]
                                }
                            },
                            "encoding": {
                                "x": {
                                    "field": "date",
                                    "type": "temporal"
                                },
                                "y": {
                                    "field": "value",
                                    "type": "quantitative",
                                    "scale": { "type": "log" }
                                },
                                color: {
                                    field: "location", type: "nominal",
                                    legend: { orient: "top" }
                                },
                                "opacity": {
                                    "condition": { "selection": "location", "value": 1 },
                                    "value": 0.2
                                }
                            }
                        }
                    ]
                },
                resolve: { scale: { y: "independent" }, axis: { x: "independent" } }
            }
        ]
    }
};

/*
 * Question 2 
 */
const vlSpecQ2calciumMagnesium = (map, csvReadings) => {
    return {
        datasets: {
            areas: map,
            rivers: map,
            points: map,
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "title": {
            text: "Calcium and Magnesium January 2011 - June 2011",
            anchor: "middle"
        },
        data: { name: "readings", format: { type: "csv" } },
        "transform": [
            { "filter": { "field": "date", "gte": { "year": 2010 } } },
            { "filter": { "field": "date", "lte": { "year": 2012 } } },
            { "filter": { "field": "measure", "oneOf": ["Calcium", "Magnesium"] } },
            { "filter": { "field": "location", "oneOf": ["Boonsri", "Busarakhan", "Chai", "Kannika", "Kohsoom", "Somchair"] } }
        ],
        hconcat: [
            {
                width: 400,
                height: 400,
                resolve: { scale: { color: "independent" } },
                layer: [
                    {
                        data: { name: "points", format: { type: "topojson", feature: "Points" } },
                        mark: {
                            type: "geoshape"
                        },
                        encoding: {
                            "detail": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "Location",
                                "legend": false
                            }
                        }
                    },
                    {
                        data: { name: "rivers", format: { type: "topojson", feature: "Rivers" } },
                        mark: {
                            type: "geoshape",
                            filled: false,
                        },
                        encoding: {
                            "color": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "River",
                                "legend": false
                            }
                        }
                    },
                    {
                        mark: {
                            type: "text",
                            "dy": -15
                        },
                        "selection": {
                            "location": {
                                "type": "multi", "fields": ["location"]
                            }
                        },
                        "encoding": {
                            "longitude": {
                                "field": "x",
                                "type": "quantitative"
                            },
                            "latitude": {
                                "field": "y",
                                "type": "quantitative"
                            },
                            "text": {
                                "field": "location",
                                "type": "nominal"
                            },
                            "color": {
                                "condition": {
                                    "selection": "location",
                                    "field": "location",
                                    "type": "nominal",
                                    "legend": false
                                },
                                "value": "grey"
                            }
                        }
                    }
                ]
            },
            {
                "facet": { "row": { "field": "measure", "type": "nominal" } },
                spec: {
                    width: 800,
                    height: 200,
                    layer: [
                        {
                            "mark": { "type": "circle", "tooltip": true },
                            "encoding": {
                                "x": { "field": "date", "type": "temporal" },
                                "y": { "field": "value", "type": "quantitative" },
                                color: { field: "location", type: "nominal" },
                                "opacity": {
                                    "condition": { "selection": "location", "value": 1 },
                                    "value": 0.2
                                }
                            }
                        },
                        {
                            "mark": { "type": "line" },
                            "selection": {
                                "location": {
                                    "type": "multi", "fields": ["location"]
                                }
                            },
                            "encoding": {
                                "x": {
                                    "field": "date",
                                    "type": "temporal"
                                },
                                "y": {
                                    "field": "value",
                                    "type": "quantitative"
                                },
                                color: {
                                    field: "location", type: "nominal",
                                    legend: { orient: "top" }
                                },
                                "opacity": {
                                    "condition": { "selection": "location", "value": 1 },
                                    "value": 0.2
                                }
                            }
                        }
                    ]
                }
            }
        ]
    }
};

const vlSpecQ2aug15 = (csvReadings) => {
    return {
        datasets: {
            readings: csvReadings
        },
        "title": {
            text: "Metals peak on 15th August 2003",
            anchor: "middle"
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        data: { name: "readings", format: { type: "csv" } },
        "transform": [
            { "filter": { "field": "date", "gte": { "year": 2003 } } },
            { "filter": { "field": "date", "lte": { "year": 2004 } } },
            { "filter": { "field": "measure", "oneOf": ["Chromium", "Copper", "Iron", "Lead", "Manganese", "Nickel", "Zinc"] } },
        ],
        "facet": { "row": { "field": "measure", "type": "nominal" } },
        spec: {
            width: 1000,
            height: 100,
            layer: [
                {
                    "mark": { "type": "circle", "tooltip": true },
                    "selection": {
                        "date": {
                            "type": "single",
                            "nearest": true,
                            "on": "mouseover",
                            "encodings": ["x"],
                            "empty": "none"
                        }
                    },
                    "encoding": {
                        "x": { "field": "date", "type": "temporal" },
                        "y": { "field": "value", "type": "quantitative" },
                        color: { field: "location", type: "nominal" },
                        "opacity": {
                            "condition": { "selection": "location", "value": 1 },
                            "value": 0.2
                        }
                    }
                },
                {
                    "mark": { "type": "line" },
                    "selection": {
                        "location": {
                            "type": "multi", "fields": ["location"]
                        }
                    },
                    "encoding": {
                        "x": {
                            "field": "date",
                            "type": "temporal"
                        },
                        "y": {
                            "field": "value",
                            "type": "quantitative"
                        },
                        color: { field: "location", type: "nominal" },
                        "opacity": {
                            "condition": { "selection": "location", "value": 1 },
                            "value": 0.2
                        }
                    }
                },
                {
                    "transform": [{ "filter": { "selection": "date" } }],
                    "mark": { "type": "rule", "color": "gray" },
                    "encoding": {
                        "x": { "type": "temporal", "field": "date" }
                    }
                }
            ]
        },
        resolve: { scale: { y: "independent" }, axis: { x: "independent" } }
    }
};

const vlSpecQ2sampling = (map, csvReadings) => {
    return {
        datasets: {
            areas: map,
            rivers: map,
            points: map,
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        data: { name: "readings", format: { type: "csv" } },
        "transform": [
            { "timeUnit": "yearmonth", "field": "date", "as": "yearmonth" }
        ],
        vconcat: [
            {
                "title": "Number of readings for the whole data range",
                "transform": [
                    {
                        "aggregate": [{ "op": "count", "as": "num_readings" }],
                        "groupby": ["location", "yearmonth"]
                    }
                ],
                "selection": {
                    "date": { "type": "interval", "encodings": ["x"] }
                },
                width: 950,
                height: 100,
                mark: { type: "area" },
                "encoding": {
                    "x": {
                        "field": "yearmonth",
                        "type": "temporal",
                        "title": "date"
                    },
                    "y": {
                        "field": "num_readings",
                        "type": "quantitative",
                        "title": "Number of readings"
                    },
                    "color": {
                        "field": "location",
                        "type": "nominal"
                    },
                    "tooltip": [
                        { "field": "location", "type": "nominal" },
                        { "field": "num_readings", "type": "quantitative", "title": "Number of readings" }
                    ]
                }
            },
            {
                "title": {
                    text: "Number of readings for each location for selected date range",
                    anchor: "middle"
                },
                "transform": [
                    { "filter": { "field": "date", "selection": "date" } },
                    {
                        "aggregate": [{ "op": "count", "as": "num_readings" }],
                        "groupby": ["location", "yearmonth"]
                    }
                ],
                width: 80,
                "mark": { "type": "line", "tooltip": true },
                "encoding": {
                    "column": { "field": "location", "type": "nominal" },
                    "x": { "field": "yearmonth", "type": "temporal", "title": "date" },
                    "y": { "field": "num_readings", "type": "quantitative", "title": "Number of readings" },
                    color: { field: "location", type: "nominal", "legend": false }
                }
            },
            {
                "title": "Number of readings for each location for selected date range on map",
                width: 500,
                height: 500,
                resolve: { scale: { color: "independent", size: "independent" } },
                layer: [
                    {
                        data: { name: "areas", format: { type: "topojson", feature: "Areas" } },
                        mark: {
                            type: "geoshape"
                        },
                        encoding: {
                            "color": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "River area",
                                "legend": false
                            },
                            "opacity": {
                                "value": 0.15
                            }
                        }
                    },
                    {
                        data: { name: "points", format: { type: "topojson", feature: "Points" } },
                        mark: {
                            type: "geoshape"
                        },
                        encoding: {
                            "detail": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "Location",
                                "legend": false
                            }
                        }
                    },
                    {
                        data: { name: "rivers", format: { type: "topojson", feature: "Rivers" } },
                        mark: {
                            type: "geoshape",
                            filled: false,
                        },
                        encoding: {
                            "color": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "River",
                                "legend": false
                            }
                        }
                    },
                    {
                        transform: [
                            { "filter": { "field": "date", "selection": "date" } }
                        ],
                        mark: {
                            type: "point",
                            shape: "square"
                        },
                        "encoding": {
                            "longitude": {
                                "field": "x",
                                "type": "quantitative"
                            },
                            "latitude": {
                                "field": "y",
                                "type": "quantitative"
                            },
                            "size": {
                                "field": "value",
                                "type": "quantitative",
                                aggregate: "count",
                                scale: { range: [0, 5000] }
                            },
                            "tooltip": { "field": "value", aggregate: "count", "type": "quantitative" }
                        }
                    },
                    {
                        transform: [
                            { "filter": { "field": "date", "selection": "date" } }
                        ],
                        mark: {
                            type: "text",
                            "dy": -15
                        },
                        "encoding": {
                            "longitude": {
                                "field": "x",
                                "type": "quantitative"
                            },
                            "latitude": {
                                "field": "y",
                                "type": "quantitative"
                            },
                            "text": { "field": "location", "type": "nominal" },
                            "color": { "field": "location", "type": "nominal", "legend": false }
                        }
                    }
                ]
            },
            {
                "title": "Reading occurances for each location for selected date range",
                width: 1000,
                "transform": [
                    { "filter": { "field": "date", "selection": "date" } },
                ],
                "mark": "tick",
                "encoding": {
                    "y": { "field": "location", "type": "nominal" },
                    "x": { "field": "date", "type": "temporal" },
                    color: { field: "location", type: "nominal", "legend": false }
                }
            },
            {
                "title": "Number of readings for each measurment for each location for selected date range",
                width: 900,
                "transform": [
                    { "filter": { "field": "date", "selection": "date" } },
                    {
                        "aggregate": [{ "op": "count", "as": "num_readings" }],
                        "groupby": ["location", "measure"]
                    }
                ],
                "encoding": {
                    "x": { "field": "location", "type": "nominal", "sort": { "field": "num_readings", "order": "descending" } },
                    "y": { "field": "measure", "type": "nominal", "sort": { "field": "num_readings", "order": "descending" } }
                },
                "layer": [
                    {
                        "mark": "rect",
                        "encoding": {
                            "color": {
                                "field": "num_readings",
                                "type": "quantitative",
                                "title": "Count of Readings",
                                "legend": { "direction": "horizontal", "gradientLength": 120 }
                            }
                        }
                    },
                    {
                        "mark": "text",
                        "encoding": {
                            "text": { "field": "num_readings", "type": "quantitative" },
                            "color": {
                                "condition": { "test": "datum['num_readings'] < 600", "value": "black" },
                                "value": "white"
                            }
                        }
                    }
                ],
                "config": {
                    "scale": { "bandPaddingInner": 0, "bandPaddingOuter": 0 },
                    "text": { "baseline": "middle" }
                }
            }
        ]
    }
};

const vlSpecQ3methylosmoline = (map, csvReadings) => {
    return {
        datasets: {
            areas: map,
            rivers: map,
            points: map,
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "title": {
            text: "Methylosmoline rise",
            anchor: "middle"
        },
        data: { name: "readings", format: { type: "csv" } },
        "transform": [
            { "filter": { "field": "date", "gte": { "year": 2014 } } },
            { "filter": { "field": "measure", "oneOf": ["Methylosmoline"] } },
            { "filter": { "field": "location", "oneOf": ["Chai", "Kohsoom", "Somchair"] } }
        ],
        hconcat: [
            {
                width: 300,
                height: 300,
                resolve: { scale: { color: "independent" } },
                layer: [
                    {
                        data: { name: "points", format: { type: "topojson", feature: "Points" } },
                        mark: {
                            type: "geoshape"
                        },
                        encoding: {
                            "detail": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "Location",
                                "legend": false
                            }
                        }
                    },
                    {
                        data: { name: "rivers", format: { type: "topojson", feature: "Rivers" } },
                        mark: {
                            type: "geoshape",
                            filled: false,
                        },
                        encoding: {
                            "color": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "River",
                                "legend": false
                            }
                        }
                    },
                    {
                        mark: {
                            type: "point",
                            shape: "square"
                        },
                        "encoding": {
                            "longitude": {
                                "field": "x",
                                "type": "quantitative"
                            },
                            "latitude": {
                                "field": "y",
                                "type": "quantitative"
                            },
                            "size": {
                                "field": "value",
                                "type": "quantitative",
                                aggregate: "median",
                                scale: { range: [0, 2500] }
                            },
                            "tooltip": { "field": "value", aggregate: "median", "type": "quantitative" }
                        }
                    },
                    {
                        mark: {
                            type: "text",
                            "dy": -15
                        },
                        "encoding": {
                            "longitude": {
                                "field": "x",
                                "type": "quantitative"
                            },
                            "latitude": {
                                "field": "y",
                                "type": "quantitative"
                            },
                            "text": {
                                "field": "location",
                                "type": "nominal"
                            },
                            "color": {
                                "field": "location",
                                "type": "nominal",
                                "legend": false
                            }
                        }
                    }
                ]
            },
            {
                width: 700,
                height: 300,
                layer: [
                    {
                        "mark": { "type": "circle", "tooltip": true },
                        "encoding": {
                            "x": { "field": "date", "type": "temporal" },
                            "y": { "field": "value", "type": "quantitative", "scale": { "type": "log" } },
                            color: { field: "location", type: "nominal" }
                        }
                    },
                    {
                        "mark": { "type": "line" },
                        "encoding": {
                            "x": {
                                "field": "date",
                                "type": "temporal"
                            },
                            "y": {
                                "field": "value",
                                "type": "quantitative"
                            },
                            color: { field: "location", type: "nominal" }
                        }
                    }
                ]
            }
        ]
    }
};

const vlSpecQ3arsenic = (map, csvReadings) => {
    return {
        datasets: {
            areas: map,
            rivers: map,
            points: map,
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "title": {
            text: "Arsenic rise",
            anchor: "middle"
        },
        data: { name: "readings", format: { type: "csv" } },
        "transform": [
            { "filter": { "field": "measure", "oneOf": ["Arsenic"] } },
            { "filter": { "field": "location", "oneOf": ["Busarakhan", "Chai", "Kannika", "Sakda", "Somchair"] } }
        ],
        hconcat: [
            {
                width: 300,
                height: 300,
                resolve: { scale: { color: "independent" } },
                layer: [
                    {
                        data: { name: "points", format: { type: "topojson", feature: "Points" } },
                        mark: {
                            type: "geoshape"
                        },
                        encoding: {
                            "detail": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "Location",
                                "legend": false
                            }
                        }
                    },
                    {
                        data: { name: "rivers", format: { type: "topojson", feature: "Rivers" } },
                        mark: {
                            type: "geoshape",
                            filled: false,
                        },
                        encoding: {
                            "color": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "River",
                                "legend": false
                            }
                        }
                    },
                    {
                        mark: {
                            type: "point",
                            shape: "square"
                        },
                        "encoding": {
                            "longitude": {
                                "field": "x",
                                "type": "quantitative"
                            },
                            "latitude": {
                                "field": "y",
                                "type": "quantitative"
                            },
                            "size": {
                                "field": "value",
                                "type": "quantitative",
                                aggregate: "median",
                                scale: { range: [0, 2500] }
                            },
                            "tooltip": { "field": "value", aggregate: "median", "type": "quantitative" }
                        }
                    },
                    {
                        mark: {
                            type: "text",
                            "dy": -15
                        },
                        "selection": {
                            "location": {
                                "type": "multi", "fields": ["location"]
                            }
                        },
                        "encoding": {
                            "longitude": {
                                "field": "x",
                                "type": "quantitative"
                            },
                            "latitude": {
                                "field": "y",
                                "type": "quantitative"
                            },
                            "text": {
                                "field": "location",
                                "type": "nominal"
                            },
                            "color": {
                                "condition": {
                                    "selection": "location",
                                    "field": "location",
                                    "type": "nominal",
                                    "legend": false
                                },
                                "value": "grey"
                            }
                        }
                    }
                ]
            },
            {
                width: 700,
                height: 300,
                layer: [
                    {
                        "mark": { "type": "circle", "tooltip": true },
                        "encoding": {
                            "x": { "field": "date", "type": "temporal" },
                            "y": { "field": "value", "type": "quantitative" },
                            color: { field: "location", type: "nominal" },
                            "opacity": {
                                "condition": { "selection": "location", "value": 1 },
                                "value": 0.1
                            }
                        }
                    },
                    {
                        "mark": { "type": "line" },
                        "encoding": {
                            "x": {
                                "field": "date",
                                "type": "temporal"
                            },
                            "y": {
                                "field": "value",
                                "type": "quantitative"
                            },
                            color: { field: "location", type: "nominal" },
                            "opacity": {
                                "condition": { "selection": "location", "value": 1 },
                                "value": 0.1
                            }
                        }
                    }
                ]
            }
        ]
    }
}

const vlSpecQ3cod = (map, csvReadings) => {
    return {
        datasets: {
            areas: map,
            rivers: map,
            points: map,
            readings: csvReadings
        },
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "title": {
            text: "Chemical Oxygen Demand (Cr) and Anionic active surfactants rise",
            anchor: "middle"
        },
        data: { name: "readings", format: { type: "csv" } },
        "transform": [
            { "filter": { "field": "measure", "oneOf": ["Chemical Oxygen Demand (Cr)", "Anionic active surfactants"] } },
            { "filter": { "field": "location", "oneOf": ["Kohsoom"] } }
        ],
        hconcat: [
            {
                width: 300,
                height: 300,
                resolve: { scale: { color: "independent" } },
                layer: [
                    {
                        data: { name: "points", format: { type: "topojson", feature: "Points" } },
                        mark: {
                            type: "geoshape"
                        },
                        encoding: {
                            "detail": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "Location",
                                "legend": false
                            }
                        }
                    },
                    {
                        data: { name: "rivers", format: { type: "topojson", feature: "Rivers" } },
                        mark: {
                            type: "geoshape",
                            filled: false,
                        },
                        encoding: {
                            "color": {
                                "field": "properties.id",
                                "type": "nominal",
                                "title": "River",
                                "legend": false
                            }
                        }
                    },
                    {
                        mark: {
                            type: "text",
                            "dy": -15
                        },
                        "encoding": {
                            "longitude": {
                                "field": "x",
                                "type": "quantitative"
                            },
                            "latitude": {
                                "field": "y",
                                "type": "quantitative"
                            },
                            "text": {
                                "field": "location",
                                "type": "nominal"
                            },
                            "color": {
                                "field": "location",
                                "type": "nominal",
                                "legend": false
                            }
                        }
                    }
                ]
            },
            {
                "facet": { "row": { "field": "measure", "type": "nominal" } },
                spec: {
                    width: 700,
                    height: 300,
                    layer: [
                        {
                            "mark": { "type": "circle", "tooltip": true },
                            "encoding": {
                                "x": { "field": "date", "type": "temporal" },
                                "y": { "field": "value", "type": "quantitative" },
                                color: { field: "location", type: "nominal" }
                            }
                        },
                        {
                            "mark": { "type": "line" },
                            "encoding": {
                                "x": {
                                    "field": "date",
                                    "type": "temporal"
                                },
                                "y": {
                                    "field": "value",
                                    "type": "quantitative"
                                },
                                color: { field: "location", type: "nominal" }
                            }
                        }
                    ]
                },
                resolve: { scale: { y: "independent" } },
            }
        ]
    }
};