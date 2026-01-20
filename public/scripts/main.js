import log from './utils.js'

log('Hello from main.js')
document.getElementById('year').textContent = new Date().getFullYear()

/**
 * THEME MANAGEMENT
 * Handles System Preference detection and Manual Toggle
 */
const themeBtn = document.getElementById('theme-toggle')
const sunIcon = themeBtn.querySelector('.sun-icon')
const moonIcon = themeBtn.querySelector('.moon-icon')
const htmlEl = document.documentElement

function updateThemeIcon(theme) {
  if (theme === 'dark') {
    moonIcon.style.display = 'block'
    sunIcon.style.display = 'none'
    themeBtn.setAttribute('aria-label', 'Switch to light mode')
  } else {
    sunIcon.style.display = 'block'
    moonIcon.style.display = 'none'
    themeBtn.setAttribute('aria-label', 'Switch to dark mode')
  }
}

function setTheme(theme) {
  if (theme === 'system') {
    localStorage.removeItem('theme')
    const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    htmlEl.setAttribute('data-theme', systemPref)
    updateThemeIcon(systemPref)
  } else {
    htmlEl.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    updateThemeIcon(theme)
  }
}

// Initialize Theme
const savedTheme = localStorage.getItem('theme')
if (savedTheme) {
  setTheme(savedTheme)
} else {
  setTheme('system')
}

// Listen for Toggle
themeBtn.addEventListener('click', () => {
  const currentTheme = htmlEl.getAttribute('data-theme')
  setTheme(currentTheme === 'dark' ? 'light' : 'dark')
})

/**
 * UNIT CONVERSION
 */
let unitMode = 'C' // 'C' or 'F'
const btnC = document.getElementById('btn-celsius')
const btnF = document.getElementById('btn-fahrenheit')
const suffixOut = document.getElementById('suffix-out')
const suffixIn = document.getElementById('suffix-in')
const suffixDp = document.getElementById('suffix-dp')
const resultRegion = document.getElementById('result-region')

function setUnit(unit) {
  unitMode = unit

  if (unit === 'C') {
    btnC.classList.add('active')
    btnC.setAttribute('aria-checked', 'true')
    btnF.classList.remove('active')
    btnF.setAttribute('aria-checked', 'false')

    suffixOut.textContent = '°C'
    suffixIn.textContent = '°C'
    suffixDp.textContent = '°C'
  } else {
    btnF.classList.add('active')
    btnF.setAttribute('aria-checked', 'true')
    btnC.classList.remove('active')
    btnC.setAttribute('aria-checked', 'false')

    suffixOut.textContent = '°F'
    suffixIn.textContent = '°F'
    suffixDp.textContent = '°F'
  }

  // Reset view on unit switch for clarity
  document.getElementById('calc-form').reset()
  resultRegion.style.display = 'none'
}

btnC.addEventListener('click', () => setUnit('C'))
btnF.addEventListener('click', () => setUnit('F'))

/**
 * CALCULATION LOGIC
 */
const fToC = (f) => ((f - 32) * 5) / 9
const cToF = (c) => (c * 9) / 5 + 32

// Magnus-Tetens Formula for Saturation Vapor Pressure (hPa)
function getSaturationVaporPressure(tempC) {
  return 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5))
}

function calculateHumidity(e) {
  e.preventDefault()

  // Get values
  const outTempInput = parseFloat(document.getElementById('outdoor-temp').value)
  const outHumInput = parseFloat(document.getElementById('outdoor-hum').value)
  const inTempInput = parseFloat(document.getElementById('indoor-temp').value)

  // Basic validation
  if (isNaN(outTempInput) || isNaN(outHumInput) || isNaN(inTempInput)) {
    alert('Please enter valid numbers for all fields.')
    return
  }

  // Normalize inputs to Celsius
  const outTempC = unitMode === 'F' ? fToC(outTempInput) : outTempInput
  const inTempC = unitMode === 'F' ? fToC(inTempInput) : inTempInput

  // 1. Calculate Saturation Vapor Pressure Outdoor (es_out)
  const esOut = getSaturationVaporPressure(outTempC)

  // 2. Calculate Actual Vapor Pressure (e)
  // We assume absolute moisture content remains constant
  const actualVaporPressure = (outHumInput / 100) * esOut

  // 3. Calculate Saturation Vapor Pressure Indoor (es_in)
  const esIn = getSaturationVaporPressure(inTempC)

  // 4. Calculate Indoor RH
  let inHum = (actualVaporPressure / esIn) * 100
  if (inHum > 100) inHum = 100
  if (inHum < 0) inHum = 0

  // 5. Calculate Dew Point (Approx)
  const alpha = Math.log(actualVaporPressure / 6.112)
  const dewPointC = (243.5 * alpha) / (17.67 - alpha)
  const displayDp = unitMode === 'F' ? cToF(dewPointC) : dewPointC

  // Update UI
  updateUI(inHum, displayDp)
}

function updateUI(humidity, dewPoint) {
  resultRegion.style.display = 'block'

  // Text Values
  document.getElementById('display-humidity').textContent = Math.round(humidity) + '%'
  document.getElementById('display-dewpoint').textContent = dewPoint.toFixed(1)

  // Gauge & Status
  const thumb = document.getElementById('gauge-thumb')
  const statusMsg = document.getElementById('status-message')
  const dispHum = document.getElementById('display-humidity')

  thumb.style.left = humidity + '%'

  let status = ''
  let color = ''

  if (humidity < 30) {
    status = 'Too Dry (< 30%)'
    color = 'var(--danger)'
  } else if (humidity >= 30 && humidity <= 60) {
    status = 'Comfortable (30-60%)'
    color = 'var(--success)'
  } else {
    status = 'Too Humid (> 60%)'
    color = 'var(--warning)'
  }

  statusMsg.textContent = status
  statusMsg.style.color = color
  dispHum.style.color = color
}

// Attach Event Listener
document.getElementById('calc-form').addEventListener('submit', calculateHumidity)

// Optional: Auto-calc on input change (if form has been submitted once)
const inputs = document.querySelectorAll('input')
inputs.forEach((input) => {
  input.addEventListener('input', () => {
    if (resultRegion.style.display !== 'none') {
      // Trigger calculation only if all values present
      const outT = document.getElementById('outdoor-temp').value
      const outH = document.getElementById('outdoor-hum').value
      const inT = document.getElementById('indoor-temp').value
      if (outT && outH && inT) {
        document.getElementById('calc-form').requestSubmit()
      }
    }
  })
})
