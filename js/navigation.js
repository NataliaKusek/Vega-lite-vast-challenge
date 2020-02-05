const initNavBar = () => {
    document.querySelectorAll("[id$='-tab-button']").forEach(button => {
        button.addEventListener('click', () => {
            console.log("Changing tab to", button.id);
            document.querySelectorAll("[id$='-tab-button']").forEach(button => {
                button.classList.remove("is-active");
            });
            button.classList.add("is-active");

            document.querySelectorAll("section[id$='-tab']").forEach(section => {
                section.classList.add("is-hidden");
            });

            document.querySelector(`section[id='${button.id.replace("-button", "")}']`).classList.remove("is-hidden");
        });
    });
}