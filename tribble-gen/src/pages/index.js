import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
const fs = require('fs');
const Canvas = require('canvas');

// renamer function: renamer --find '/_.*.png$/' --replace '.png' ./240/**/*

export default function Home({img}) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <div>
          <img src={img} className={styles.px} />
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  function rndIncl(min, max) { // min and max included
    return Math.floor((Math.random() * (max - min + 1)) + min);
  }  
  const builtCombos = {};
  const bodyDir = 'body';
  const dirBase = '../notfromterra-js13k2021/design/layers';
  const attrFiles = {
    eyes: fs.readdirSync(`${dirBase}/eyes`),
    face: fs.readdirSync(`${dirBase}/face`),
    feet: fs.readdirSync(`${dirBase}/feet`),
    hair: fs.readdirSync(`${dirBase}/hair`),
    mouth: fs.readdirSync(`${dirBase}/mouth`),
  };
  const img = new Canvas.Image();
  const canvas = Canvas.createCanvas(24, 24);
  const ctx = canvas.getContext('2d');

  // Draw the outline:
  img.src = `${dirBase}/outline.png`;
  ctx.drawImage(img, 0, 0);

  const getBody = () => {
    const base = `${dirBase}/${bodyDir}`;
    const bodies = fs.readdirSync(base);
    const i = new Canvas.Image();
    const idx = rndIncl(0, bodies.length - 1);

    i.src = `${base}/${bodies[idx]}`;

    return { idx: 0, img: i};
  };

  const getAttr = (attr) => {
    const base = `${dirBase}/${attr}`;
    const attrFiles = fs.readdirSync(base);
    const fileIdx = rndIncl(0, attrFiles.length);

    return fileIdx
  };

  const getRandomTribble = async () => {
    const { idx, img } = getBody();
    ctx.drawImage(img, 0, 0);

    const attrIndexes = [];

    Object.entries(attrFiles).forEach(([k, v]) => {
      attrIndexes.push(getAttr(k))
    })

    const combo = attrIndexes.join('-')

    console.log(combo)

    if (!builtCombos[combo]) {
      const promises = []

      console.log(attrIndexes, attrFiles)

      builtCombos[combo] = true

      attrIndexes.forEach((index, i) => {
        const attrArrays = Object.entries(attrFiles)

        if (index <= attrArrays[i][1].length - 1) {
          console.log(attrArrays[i][1][index])
          promises.push(Canvas.loadImage(`${dirBase}/${attrArrays[i][0]}/${attrArrays[i][1][index]}`))
        }
      })

      return Promise.all(promises)
    }
    else {
      console.log('FAILED - combo already seen')
    }
  };

  const layerImages = await getRandomTribble();

  layerImages.forEach(image => {
    ctx.drawImage(image, 0, 0)
  })

  const final = canvas.toDataURL();

  console.log(final);

  return {
    props: {
      img: final,
    },
  };
}