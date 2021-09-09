import './main.scss'
// import 'regenerator-runtime'
import { doNearStuff, signIn, signOut, claimNFT, viewNFT } from './near'
import * as UI from './docui'
import C from './constants'

/**
 * Imported in `index.html` -
 * Near API: https://js13kgames.com/src/near-api-js.js
 *  - Near API JS Documentation: https://docs.near.org/docs/develop/front-end/near-api-js
 * Johannes Baagøe's Alea PRNG: https://github.com/davidbau/seedrandom
 */

const dims = 1000
const map = []
const arng = new alea('hello.')
const opts = [0, 50, 100, 150, 200, 225, 250]
const l = opts.length - 1
const t = dims - l
const keyZones = {}
const gearZones = {}
const otherZones = {}

function randomIntInclusive(min, max) { // min and max included
  return Math.floor((Math.random() * (max - min + 1)) + min)
}
// function randomIntFromTuple(arr) { // min and max included
//   return Math.floor((Math.random() * (arr[1] - arr[0] + 1)) + arr[0])
// }

/**
 * EVENTS
 */
const util = {
  getRandomKeyPoint: () => {
    const zoneKeys = Object.keys(keyZones)

    const i = randomIntInclusive(0, zoneKeys.length)

    return zoneKeys[i]
  },
  getTribbleId: (keyPoints) => {
    return `${C.TRIBBLE_PREFIX}${keyPoints}`
  },
  getTribblePreview: (keyPoints) => {
    return `${C.TRIBBLE_PREVIEW_URL}${C.TRIBBLE_PREFIX}${keyPoints}${C.TRIBBLE_SUFFIX}`
  },
  showTribble: async (keyPoints) => {
    const tribbleId = util.getTribbleId(keyPoints)
    const tribblePreview = util.getTribblePreview(keyPoints)
    const data = await viewNFT(tribbleId)

    if (data) {
      console.log(data)
      UI.setDetails('tribble')
      UI.setTribbleData(data, tribblePreview)

      return true
    }

    return false
  },
  getRandomGear: () => {
    const keysArr = Object.keys(C.GEAR)
    const i = randomIntInclusive(0, keysArr.length - 1)
    const gear = keysArr[i]

    console.log('Have some gear!', gear, 'Do you have it already?', C.GEAR[gear], i, keysArr.length)
    UI.setGearData(gear)

    if (!C.GEAR[gear]) {
      window.localStorage.setItem(gear, 'true')

      C.GEAR[gear] = true

      console.log('This is new and fun for dressing up your stuffed tribble!')
    }
    else {
      console.log('You already have one of theses. Maybe someone else will find it someday.')
    }
  },
  giveStuffedTribble: () => {
    console.log('HAVE A STUFFED TRIBBLE!')
    UI.setGearData('stuffed-tribble')
    C.GEAR['stuffed-tribble'] = true
    window.localStorage.setItem('stuffed-tribble', 'true')
  },
  checkClickedPixel: async ({ x, y, key }) => {
    UI.setDataFetching(true)
    UI.setDetails('clear')

    if (!C.GEAR['stuffed-tribble']) {
      UI.setDetails('gear')
      util.giveStuffedTribble()
    }
    else if (gearZones[key]) {
      console.log('Gear Zone', x, y)
      UI.setDetails('gear')
      util.getRandomGear()
    }
    else if (otherZones[key]) {
      console.log('Other Zone', x, y)
      UI.setDetails('other')
    }
    else {
      console.log(`x: ${ x } y: ${ y}`)
      // await util.showTribble(key)

      // TESTING:
      const found = await util.showTribble(util.getRandomKeyPoint())

      if (!found) {
        UI.setDetails('empty')
      }
      // Temp owned by benjaminwfox.testnet
      // await util.showTribble('787-902')
      // await util.showTribble('208-918')
      // await util.showTribble('727-370')

      // Owned by bwftestacct-1
      // Tribble_R1_668-627
    }

    // if (keyZones[key]) {
    //   console.log('!!KEY ZONE!!', x, y)
    // }

    UI.setDataFetching(false)
  },
}

const addHotCoords = (n, j, i) => {
  if (n > 504 && n < 515) {
    keyZones[`${j}-${i}`] = true
  }
  if (n > 600 && n < 700) {
    gearZones[`${j}-${i}`] = true
  }
  if (n > 800 && n < 900) {
    otherZones[`${j}-${i}`] = true
  }
}

const getColor = (a, b) => {
  const prn = arng()
  const r = parseInt(prn * dims, 10)

  addHotCoords(r, a, b)

  if (r < t) {
    return opts[0]
  }

  const v = opts[dims - r]

  return v
}

const colorCanvas = (ctx) => {
  for (let i = 0; i < dims; i += 1) {
    const row = []

    for (let j = 0; j < dims; j += 1) {
      const c = getColor(j, i)

      row.push(c)
      ctx.fillStyle = `rgb(${c}, ${c}, ${c})`
      ctx.fillRect(j, i, 1, 1)
    }

    map.push(row)
  }

  const keyStr = Object.keys(keyZones).join(',')

  console.log('Key Zones', Object.keys(keyZones).length) // 10048
  console.log('Gear Zones', Object.keys(gearZones).length) // 98464
  console.log('Other Zones', Object.keys(otherZones).length) // 99027

  // If required, reenable to get filenames for all tokens:
  // console.log(keyStr)
}

function getCursorPosition(canvas, event) {
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor(event.clientX - rect.left)
  const y = Math.floor(event.clientY - rect.top)

  return { x, y, key: `${x}-${y}` }
}

function initLocalStorage() {
  const gearArr = Object.keys(C.GEAR)

  gearArr.forEach((key) => {
    if (window.localStorage.getItem(key)) {
      C.GEAR[key] = true
    }
  })
}

window.onload = async () => {
  initLocalStorage()

  console.log('NEARAPI', window.nearApi)

  UI.modClassById(false, 'b', 'loading')

  await doNearStuff()
  // const viewBtn = document.getElementById('view')
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')

  window.fn = {
    signIn,
    signOut,
    claimNFT,
    closeOverlay: UI.closeOverlay,
  }

  canvas.width = dims
  canvas.height = dims
  canvas.addEventListener('mousedown', function (e) {
    const pos = getCursorPosition(canvas, e)

    // const p = util.getRandomKeyPoint()
    util.checkClickedPixel(pos)
  })

  UI.setDetails('empty')

  colorCanvas(ctx)

  console.log('Complete', keyZones, Object.keys(gearZones).length, Object.keys(otherZones).length)
}
