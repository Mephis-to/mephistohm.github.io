// Optional small typing animation
const lines = document.querySelectorAll('.output');

lines.forEach((line, index) => {
    line.style.opacity = 0;

    setTimeout(() => {
        line.style.transition = "opacity 0.5s ease";
        line.style.opacity = 1;
    }, 500 * index);
});
