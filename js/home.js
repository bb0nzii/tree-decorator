function createSnowflake() {
  const snowflake =
  document.createElement("img");
  snowflake.classList.add("snowflake");
  snowflake.src = "./assets/backgrounds/snow.svg";
  snowflake.alt = "snow";

  const size = Math.random() * 12 + 8;
  snowflake.style.width = `${size}px`;
  snowflake.style.height = "auto";

  snowflake.style.left = Math.random() * window.innerWidth + "px";

  const duration = Math.random() * 7 + 8;
  snowflake.style.animationDuration = `${duration}s`;

  document.getElementById("snow-container").appendChild(snowflake);

  setTimeout(() => {
    snowflake.remove();
  }, duration * 1000);
}

setInterval(createSnowflake, 250);