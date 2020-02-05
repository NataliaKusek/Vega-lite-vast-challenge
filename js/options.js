const scaleState = {};

const options = (id, { onChange, onSubmit }) => {
    scaleState[id] = "linear";

    const optionsDiv = document.querySelector(id);

    optionsDiv.appendChild(htmlToElement(`<h1 class="title is-spaced">Options</h1>`));

    optionsDiv.appendChild(htmlToElement(`<h2 class="subtitle is-spaced">Scale</h2>`));

    const scaleElement = htmlToElement(`<div class="content">
        <label class="radio">
        <input type="radio" name="scale" value="linear" checked>
        Linear
        </label>
        <label class="radio">
        <input type="radio" name="scale" value="log">
        Logarithmic
        </label>
    </div>`);
    scaleElement.querySelectorAll("input").forEach(input => {
        input.addEventListener("change", () => {
            console.log("Changing scale to", input.value);
            scaleState[id] = input.value;
            onChange();
        });
    })

    optionsDiv.appendChild(scaleElement);
};

const optionsState = (id) => {
    return {
        scale: scaleState[id]
    }
};