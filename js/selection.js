const selectedMeasuresState = {};

const selection = (id, { singleSelection, measures, selectedMeasures, onChange, onSubmit }) => {
    selectedMeasuresState[id] = [...selectedMeasures];

    const selectionDiv = document.querySelector(id);

    while (selectionDiv.firstChild) {
        selectionDiv.removeChild(selectionDiv.firstChild);
    }

    selectionDiv.appendChild(htmlToElement(`<h1 class="title is-spaced">Selection</h1>`));

    selectionDiv.appendChild(htmlToElement(`<h2 class="subtitle is-spaced">Measurements</h2>`));

    const measuresDiv = htmlToElement('<div class="content"></div>');

    measures.forEach(measure => {
        const type = singleSelection && "radio" || "checkbox"
        const selectionElement = htmlToElement(`<div><label class="${type}"><input type="${type}" name="${measure}">${measure}</div>`);
        selectionElement.querySelector("input").checked = containsString(selectedMeasuresState[id], measure);
        selectionElement.querySelector("input").addEventListener("click", () => {
            if (singleSelection) {
                console.log("Selecting single", measure);
                measuresDiv.querySelectorAll('input').forEach(inputElement => {
                    inputElement.checked = false;
                    selectedMeasuresState[id] = [];
                });
                selectionElement.querySelector("input").checked = true;
                selectedMeasuresState[id].push(measure);
            } else {
                const inputElement = selectionElement.querySelector('input');
                if (!inputElement.checked) {
                    console.log("Deselecting", measure);
                    selectedMeasuresState[id] = selectedMeasuresState[id].filter(selectedMeasure => selectedMeasure != measure);
                } else {
                    console.log("Selecting", measure);
                    selectedMeasuresState[id].push(measure);
                }
            }
            onChange();
        });
        measuresDiv.appendChild(selectionElement);
    });
    selectionDiv.appendChild(measuresDiv);
};

const selectionState = (id) => {
    return {
        measures: selectedMeasuresState[id]
    }
};