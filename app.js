const apiBase = 'https://api.open-meteo.com/v1/forecast';
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const refreshButton = document.getElementById('refresh-button');
const errorMessage = document.getElementById('error-message');

// Função para buscar clima com base no nome da cidade
function fetchWeather(city) {
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const { latitude, longitude, name } = data.results[0];
                fetchWeatherByCoordinates(latitude, longitude, name); // Passa o nome da cidade
            } else {
                showError("City not found.");
            }
        })
        .catch(() => showError("Failed to fetch weather data."));
}

// Função para buscar clima por coordenadas
function fetchWeatherByCoordinates(lat, lon, cityName) {
    fetch(`${apiBase}?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe%2FBerlin`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.current_weather) {
                updateUI(data.current_weather, cityName); // Use cityName aqui
                updateForecastUI(data.daily);
                errorMessage.textContent = '';
                localStorage.setItem('lastCity', cityName);
                localStorage.setItem('lastWeather', JSON.stringify(data.current_weather));
            } else {
                showError("Weather data not available.");
            }
        })
        .catch(error => {
            console.error("Fetch error: ", error);
            showError("Failed to fetch weather data.");
        });
}

// Função para atualizar a interface do usuário com os dados de clima
function updateUI(weather, city) {
    const temperature = weather.temperature;
    const weatherCode = weather.weathercode;

    document.getElementById('city-name').textContent = city; // Aqui exibimos o nome da cidade
    document.getElementById('temperature').textContent = `${temperature}°C`;

    // Atualizando o ícone do clima
    const weatherIcon = document.getElementById('weather-icon');
    updateWeatherIcon(weatherIcon, weatherCode);

    document.getElementById('description').textContent = `Weather Code: ${weatherCode}`;
}

// Função para atualizar o ícone com base no código do clima
function updateWeatherIcon(weatherIcon, weatherCode) {
    weatherIcon.className = ''; // Limpa as classes anteriores

    // Mapeando os códigos de clima para os ícones do Font Awesome
    switch (weatherCode) {
        case 0:
        case 1:
            weatherIcon.classList.add('fas', 'fa-sun'); // Céu limpo
            break;
        case 2:
        case 3:
            weatherIcon.classList.add('fas', 'fa-cloud'); // Nublado
            break;
        case 45:
        case 48:
            weatherIcon.classList.add('fas', 'fa-smog'); // Nebuloso
            break;
        case 51:
        case 53:
        case 61:
        case 63:
            weatherIcon.classList.add('fas', 'fa-cloud-rain'); // Chuva leve a moderada
            break;
        case 80:
        case 81:
            weatherIcon.classList.add('fas', 'fa-cloud-showers-heavy'); // Chuva forte
            break;
        case 71:
        case 73:
        case 75:
            weatherIcon.classList.add('fas', 'fa-snowflake'); // Neve
            break;
        case 95:
        case 96:
        case 99:
            weatherIcon.classList.add('fas', 'fa-bolt'); // Tempestade
            break;
        default:
            weatherIcon.classList.add('fas', 'fa-sun'); // Padrão para sol
    }
}

// Função para atualizar a previsão do tempo
function updateForecastUI(daily) {
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';  // Limpa o container

    // Array com as siglas dos dias da semana
    const dayAbbreviations = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    daily.temperature_2m_max.forEach((maxTemp, index) => {
        const minTemp = daily.temperature_2m_min[index];
        const weatherCode = daily.weathercode[index]; // Pegando o código do clima para cada dia

        const dayElement = document.createElement('div');
        dayElement.classList.add('forecast-day');

        // Crie um elemento para o ícone do clima
        const weatherIcon = document.createElement('i');
        updateWeatherIcon(weatherIcon, weatherCode); // Atualiza o ícone com base no código do clima

        // Adicionando o ícone e as temperaturas ao elemento do dia
        dayElement.innerHTML = `
            <p>${dayAbbreviations[index]}</p>
            ${weatherIcon.outerHTML} 
            <span>Max: ${maxTemp}°C, Min: ${minTemp}°C</span>
        `;
        forecastContainer.appendChild(dayElement);
    });
}

// Função para mostrar erros
function showError(message) {
    errorMessage.textContent = message;
}

// Função para obter a localização do usuário
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoordinates(latitude, longitude, "Localização Atual"); // Passa um nome padrão
        }, () => showError("Falha ao obter sua localização."));
    } else {
        showError("Geolocalização não é suportada por este navegador.");
    }
}

// Atualize o evento do botão de atualizar clima
refreshButton.addEventListener('click', () => {
    const city = cityInput.value;
    if (city) {
        fetchWeather(city);
    } else {
        getLocation();
    }
});

// Eventos
searchButton.addEventListener('click', () => {
    const city = cityInput.value;
    if (city) {
        fetchWeather(city);
    } else {
        showError("Por favor, insira o nome de uma cidade.");
    }
});

// Função para carregar a última cidade e clima quando a página é carregada
function loadLastWeather() {
    const lastCity = localStorage.getItem('lastCity');
    const lastWeather = localStorage.getItem('lastWeather');
    if (lastCity && lastWeather) {
        updateUI(JSON.parse(lastWeather), lastCity);
    } else {
        getLocation(); // Se não houver cidade ou clima armazenado, obter a localização inicial
    }
}

// Executa ao carregar a página
window.onload = loadLastWeather;
