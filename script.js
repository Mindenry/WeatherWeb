const apiKey = "42180c97446fa996120e4fbf978a1aa0";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&lang=th&";
const forecastApiUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&lang=th&";
const airQualityApiUrl = "https://api.openweathermap.org/data/2.5/air_pollution?";

const searchBox = document.querySelector(".search-box input");
const searchBtn = document.querySelector(".search-box button");
const weatherIcon = document.querySelector(".weather-icon img");
const loading = document.querySelector(".loading");
const error = document.querySelector(".error");
const weatherDiv = document.querySelector(".weather");
const currentDateEl = document.getElementById("current-date");

// ซ่อนข้อมูลสภาพอากาศตอนเริ่มต้น
weatherDiv.style.display = "none";

// แสดงวันที่ปัจจุบัน
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('th-TH', options);
}
updateCurrentDate();

// ฟังก์ชันสำหรับบันทึกประวัติการค้นหา
function saveSearchHistory(city) {
    let searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
    
    // ตรวจสอบว่าเมืองนี้มีอยู่แล้วหรือไม่
    const cityIndex = searchHistory.indexOf(city);
    if (cityIndex !== -1) {
        // ถ้ามีอยู่แล้ว ลบออกเพื่อเพิ่มเข้าไปที่ตำแหน่งแรก
        searchHistory.splice(cityIndex, 1);
    }
    
    // เพิ่มเมืองที่ค้นหาล่าสุดไว้ที่ตำแหน่งแรก
    searchHistory.unshift(city);
    
    // จำกัดจำนวนประวัติไว้ที่ 5 รายการ
    if (searchHistory.length > 5) {
        searchHistory = searchHistory.slice(0, 5);
    }
    
    localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
    
    // อัพเดต datalist สำหรับการค้นหา
    updateSearchSuggestions();
}

// ฟังก์ชันอัพเดตรายการแนะนำการค้นหา
function updateSearchSuggestions() {
    const searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
    
    // สร้าง datalist หากยังไม่มี
    let datalist = document.getElementById('city-suggestions');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'city-suggestions';
        document.body.appendChild(datalist);
        
        // เชื่อมโยง datalist กับ input
        searchBox.setAttribute('list', 'city-suggestions');
    }
    
    // ล้างรายการเก่าและเพิ่มรายการใหม่
    datalist.innerHTML = '';
    searchHistory.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        datalist.appendChild(option);
    });
}

// Weather icons mapping
const weatherIcons = {
    "01d": "https://openweathermap.org/img/wn/01d@4x.png",
    "01n": "https://openweathermap.org/img/wn/01n@4x.png",
    "02d": "https://openweathermap.org/img/wn/02d@4x.png",
    "02n": "https://openweathermap.org/img/wn/02n@4x.png",
    "03d": "https://openweathermap.org/img/wn/03d@4x.png",
    "03n": "https://openweathermap.org/img/wn/03n@4x.png",
    "04d": "https://openweathermap.org/img/wn/04d@4x.png",
    "04n": "https://openweathermap.org/img/wn/04n@4x.png",
    "09d": "https://openweathermap.org/img/wn/09d@4x.png",
    "09n": "https://openweathermap.org/img/wn/09n@4x.png",
    "10d": "https://openweathermap.org/img/wn/10d@4x.png",
    "10n": "https://openweathermap.org/img/wn/10n@4x.png",
    "11d": "https://openweathermap.org/img/wn/11d@4x.png",
    "11n": "https://openweathermap.org/img/wn/11n@4x.png",
    "13d": "https://openweathermap.org/img/wn/13d@4x.png",
    "13n": "https://openweathermap.org/img/wn/13n@4x.png",
    "50d": "https://openweathermap.org/img/wn/50d@4x.png",
    "50n": "https://openweathermap.org/img/wn/50n@4x.png"
};

// Weather background classes
const weatherBackgrounds = {
    "Clear": "clear-sky",
    "Clouds": "clouds",
    "Rain": "rain",
    "Drizzle": "rain",
    "Thunderstorm": "thunderstorm",
    "Snow": "snow",
    "Mist": "mist",
    "Smoke": "mist",
    "Haze": "mist",
    "Dust": "mist",
    "Fog": "mist",
    "Sand": "mist",
    "Ash": "mist",
    "Squall": "mist",
    "Tornado": "mist"
};

// แปลงวันเป็นภาษาไทย
function getThaiDay(timestamp) {
    const date = new Date(timestamp * 1000);
    const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    return days[date.getDay()];
}

// ฟังก์ชันแปลงความเร็วลมเป็นระดับความแรง
function getWindDescription(speed) {
    if (speed < 1) return "ลมสงบ";
    if (speed < 5) return "ลมเบา";
    if (speed < 11) return "ลมอ่อน";
    if (speed < 19) return "ลมปานกลาง";
    if (speed < 28) return "ลมแรง";
    if (speed < 38) return "ลมแรงมาก";
    return "พายุ";
}

// ฟังก์ชันแปลงค่า AQI เป็นคำอธิบายคุณภาพอากาศ
function getAQIDescription(aqi) {
    switch(aqi) {
        case 1: return "<span class='aqi-good'>ดี</span>";
        case 2: return "<span class='aqi-moderate'>ปานกลาง</span>";
        case 3: return "<span class='aqi-unhealthy'>ไม่ดีต่อกลุ่มเสี่ยง</span>";
        case 4: return "<span class='aqi-very-unhealthy'>ไม่ดีต่อสุขภาพ</span>";
        case 5: return "<span class='aqi-hazardous'>อันตราย</span>";
        default: return "ไม่มีข้อมูล";
    }
}

// ฟังก์ชันขอตำแหน่งปัจจุบันของผู้ใช้
function getCurrentLocation() {
    if (navigator.geolocation) {
        // แสดงว่ากำลังโหลด
        weatherDiv.style.display = "none";
        error.style.display = "none";
        loading.style.display = "flex";
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                checkWeatherByCoords(lat, lon);
            },
            (err) => {
                console.error("Error getting location:", err);
                loading.style.display = "none";
                error.style.display = "flex";
                error.querySelector("p").textContent = "ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่อีกครั้ง";
            }
        );
    } else {
        error.style.display = "flex";
        error.querySelector("p").textContent = "เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง";
    }
}

// ฟังก์ชันตรวจสอบสภาพอากาศโดยใช้พิกัด
async function checkWeatherByCoords(lat, lon) {
    try {
        // ดึงข้อมูลสภาพอากาศปัจจุบัน
        const weatherResponse = await fetch(`${apiUrl}lat=${lat}&lon=${lon}&appid=${apiKey}`);
        
        if (!weatherResponse.ok) {
            throw new Error('Location not found');
        }
        
        const weatherData = await weatherResponse.json();
        
        // บันทึกชื่อเมืองลงในประวัติ
        saveSearchHistory(weatherData.name);
        
        // อัพเดตข้อมูลสภาพอากาศ
        updateWeatherUI(weatherData);
        
        // ดึงข้อมูลพยากรณ์อากาศ
        await getForecastData(lat, lon);
        
        // ดึงข้อมูลคุณภาพอากาศ
        await getAirQualityData(lat, lon);
        
    } catch (err) {
        // แสดงข้อความผิดพลาด
        weatherDiv.style.display = "none";
        loading.style.display = "none";
        error.style.display = "flex";
        console.error(err);
    }
}

// ดึงข้อมูลคุณภาพอากาศ
async function getAirQualityData(lat, lon) {
    try {
        const airQualityResponse = await fetch(`${airQualityApiUrl}lat=${lat}&lon=${lon}&appid=${apiKey}`);
        
        if (!airQualityResponse.ok) {
            throw new Error('Air quality data not available');
        }
        
        const airQualityData = await airQualityResponse.json();
        
        // หากมี element สำหรับแสดงข้อมูลคุณภาพอากาศ
        const airQualityEl = document.querySelector(".air-quality");
        if (airQualityEl && airQualityData.list && airQualityData.list.length > 0) {
            const aqi = airQualityData.list[0].main.aqi;
            airQualityEl.innerHTML = getAQIDescription(aqi);
        }
        
    } catch (err) {
        console.error("Error getting air quality data:", err);
        // ไม่แสดงข้อความผิดพลาดเพราะนี่เป็นข้อมูลเสริม
    }
}

// อัพเดต UI ของสภาพอากาศ
function updateWeatherUI(weatherData) {
    document.querySelector(".city").innerHTML = weatherData.name;
    document.querySelector(".temp").innerHTML = Math.round(weatherData.main.temp) + "°C";
    document.querySelector(".humidity").innerHTML = weatherData.main.humidity + "%";
    
    // อัพเดตข้อมูลลม
    const windSpeed = Math.round(weatherData.wind.speed);
    document.querySelector(".wind").innerHTML = windSpeed + " km/h";
    
    // หากมี element สำหรับแสดงคำอธิบายความเร็วลม
    const windDescEl = document.querySelector(".wind-description");
    if (windDescEl) {
        windDescEl.textContent = getWindDescription(windSpeed);
    }
    
    document.querySelector(".weather-description").innerHTML = weatherData.weather[0].description;
    document.querySelector(".feels-like span").innerHTML = Math.round(weatherData.main.feels_like) + "°C";
    document.querySelector(".temp-min-max span").innerHTML = 
        Math.round(weatherData.main.temp_min) + "°C / " + 
        Math.round(weatherData.main.temp_max) + "°C";
    
    // อัพเดตไอคอนสภาพอากาศ
    const iconCode = weatherData.weather[0].icon;
    weatherIcon.src = weatherIcons[iconCode] || `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    
    // อัพเดตพื้นหลังตามสภาพอากาศ
    const weatherMain = weatherData.weather[0].main;
    document.body.className = weatherBackgrounds[weatherMain] || "";
}

// ดึงข้อมูลพยากรณ์อากาศ
async function getForecastData(lat, lon) {
    try {
        const forecastResponse = await fetch(`${forecastApiUrl}lat=${lat}&lon=${lon}&appid=${apiKey}`);
        const forecastData = await forecastResponse.json();
        
        // ดึงพยากรณ์รายวัน (ทุก 24 ชั่วโมง)
        const dailyForecasts = forecastData.list.filter((item, index) => index % 8 === 0).slice(0, 5);
        
        // อัพเดตพยากรณ์
        const forecastContainer = document.querySelector(".forecast");
        forecastContainer.innerHTML = "";
        
        dailyForecasts.forEach(day => {
            const dayName = getThaiDay(day.dt);
            const temp = Math.round(day.main.temp);
            const iconCode = day.weather[0].icon;
            const iconUrl = weatherIcons[iconCode] || `https://openweathermap.org/img/wn/${iconCode}.png`;
            const description = day.weather[0].description;
            
            forecastContainer.innerHTML += `
                <div class="forecast-day">
                    <p>${dayName}</p>
                    <img src="${iconUrl}" alt="Weather">
                    <p class="forecast-temp">${temp}°C</p>
                    <p class="forecast-desc">${description}</p>
                </div>
            `;
        });
        
        // แสดงข้อมูลสภาพอากาศและซ่อนการโหลด
        weatherDiv.style.display = "block";
        loading.style.display = "none";
        
    } catch (err) {
        console.error("Error getting forecast data:", err);
        // แสดงข้อความผิดพลาดในกรณีที่ไม่มีพยากรณ์อากาศ
        const forecastContainer = document.querySelector(".forecast");
        forecastContainer.innerHTML = "<p class='forecast-error'>ไม่สามารถโหลดข้อมูลพยากรณ์อากาศได้</p>";
        
        // ยังคงแสดงข้อมูลสภาพอากาศปัจจุบัน
        weatherDiv.style.display = "block";
        loading.style.display = "none";
    }
}

async function checkWeather(city) {
    // ซ่อนข้อมูลและแสดงการโหลด
    weatherDiv.style.display = "none";
    error.style.display = "none";
    loading.style.display = "flex";
    
    try {
        // ดึงข้อมูลสภาพอากาศปัจจุบัน
        const weatherResponse = await fetch(apiUrl + `q=${city}&appid=${apiKey}`);
        
        if (!weatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const weatherData = await weatherResponse.json();
        
        // บันทึกชื่อเมืองลงในประวัติ
        saveSearchHistory(weatherData.name);
        
        // อัพเดตข้อมูลสภาพอากาศ
        updateWeatherUI(weatherData);
        
        // ดึงข้อมูลพยากรณ์อากาศ
        await getForecastData(weatherData.coord.lat, weatherData.coord.lon);
        
        // ดึงข้อมูลคุณภาพอากาศ
        await getAirQualityData(weatherData.coord.lat, weatherData.coord.lon);
        
    } catch (err) {
        // แสดงข้อความผิดพลาด
        weatherDiv.style.display = "none";
        loading.style.display = "none";
        error.style.display = "flex";
        console.error(err);
    }
}

// เริ่มต้นแอปพลิเคชัน
function initApp() {
    // โหลดประวัติการค้นหา
    updateSearchSuggestions();
    
    // เพิ่มปุ่มระบุตำแหน่งปัจจุบัน
    const searchBox = document.querySelector(".search-box");
    if (!document.querySelector(".location-btn")) {
        const locationBtn = document.createElement("button");
        locationBtn.className = "location-btn";
        locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
        locationBtn.title = "ใช้ตำแหน่งปัจจุบัน";
        searchBox.appendChild(locationBtn);
        
        // เพิ่ม Event Listener
        locationBtn.addEventListener("click", getCurrentLocation);
    }
    
    // เพิ่ม section สำหรับข้อมูลคุณภาพอากาศ
    const detailsSection = document.querySelector(".details");
    if (detailsSection && !document.querySelector(".air-quality-container")) {
        const airQualityContainer = document.createElement("div");
        airQualityContainer.className = "air-quality-container extras";
        airQualityContainer.innerHTML = `
            <div class="air-quality-item">
                <i class="fas fa-lungs"></i>
                <p>คุณภาพอากาศ: <span class="air-quality">กำลังโหลด...</span></p>
            </div>
        `;
        
        // แทรกก่อนส่วน forecast
        const forecastTitle = document.querySelector(".forecast-title");
        if (forecastTitle) {
            forecastTitle.parentNode.insertBefore(airQualityContainer, forecastTitle);
        } else {
            detailsSection.parentNode.appendChild(airQualityContainer);
        }
    }
}

// Event listeners
searchBtn.addEventListener("click", () => {
    if (searchBox.value.trim() !== "") {
        checkWeather(searchBox.value);
    }
});

searchBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && searchBox.value.trim() !== "") {
        checkWeather(searchBox.value);
    }
});

// เพิ่ม Event Listener สำหรับ dark mode toggle
document.addEventListener('DOMContentLoaded', () => {
    // เพิ่มปุ่ม toggle dark mode
    const card = document.querySelector(".card");
    if (card) {
        const darkModeToggle = document.createElement("button");
        darkModeToggle.className = "dark-mode-toggle";
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        darkModeToggle.title = "เปลี่ยนโหมดสีเข้ม/สีอ่อน";
        
        // เพิ่มไว้ที่มุมขวาบนของการ์ด
        const cardHeader = document.createElement("div");
        cardHeader.className = "card-header";
        
        const appTitle = document.createElement("div");
        appTitle.className = "app-title";
        appTitle.innerHTML = '<i class="fas fa-cloud-sun"></i> สภาพอากาศ';
        
        cardHeader.appendChild(appTitle);
        cardHeader.appendChild(darkModeToggle);
        
        // แทรกไว้ด้านบนสุด
        card.insertBefore(cardHeader, card.firstChild);
        
        // เพิ่ม Event Listener
        darkModeToggle.addEventListener("click", toggleDarkMode);
    }
    
    // เริ่มต้นแอปพลิเคชัน
    initApp();
    
    // โหลดสภาพอากาศเริ่มต้นสำหรับกรุงเทพ
    checkWeather("Bangkok");
});

// ฟังก์ชันเปลี่ยนโหมดสีเข้ม/สีอ่อน
function toggleDarkMode() {
    document.body.classList.toggle("dark-theme");
    
    // เปลี่ยนไอคอนตามโหมด
    const darkModeToggle = document.querySelector(".dark-mode-toggle i");
    if (darkModeToggle) {
        if (document.body.classList.contains("dark-theme")) {
            darkModeToggle.className = "fas fa-sun";
        } else {
            darkModeToggle.className = "fas fa-moon";
        }
    }
    
    // บันทึกการตั้งค่า
    localStorage.setItem("weatherAppDarkMode", document.body.classList.contains("dark-theme"));
}

// โหลดการตั้งค่าโหมดสีเข้ม/สีอ่อน
function loadDarkModePreference() {
    const darkModeEnabled = localStorage.getItem("weatherAppDarkMode") === "true";
    if (darkModeEnabled) {
        document.body.classList.add("dark-theme");
        const darkModeToggle = document.querySelector(".dark-mode-toggle i");
        if (darkModeToggle) {
            darkModeToggle.className = "fas fa-sun";
        }
    }
}

// โหลดการตั้งค่าเมื่อหน้าเว็บโหลดเสร็จ
window.addEventListener("load", loadDarkModePreference);