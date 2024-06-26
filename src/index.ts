import cron from 'node-cron';
import pupperteer from 'puppeteer';
import 'dotenv/config';
import twilio from 'twilio';

const NUMBERS = [
  '+51935761921',
  '+51963291911',
  '+51923212867',
];

const TEXTS = {
  word: 'SISTEMA',
  text: 'La carrera profesional de Ingeniería de Sistemas ya está disponible. Visita: http://extranet.unsa.edu.pe/sisacad/talonpago_pregrado_a_nuevo/ para matricularte.',
};

const findText = async () => {
  try {
    const browser = await pupperteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('http://extranet.unsa.edu.pe/sisacad/talonpago_pregrado_a_nuevo/');

    await page.waitForSelector('body');

    const bodyContent = await page.evaluate(() => document.querySelector('select').innerText);

    const match = bodyContent.includes(TEXTS.word);

    browser.close();

    if (!match) {
      console.log('Aun no esta lista la matricula', (new Date()).toLocaleString());
      return;
    }
  } catch (error) {
    console.error(error);
    return;
  }

  const { ACCOUNT_SID, AUTH_TOKEN } = process.env;

  const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

  try {
    const messages = NUMBERS.map(async (number) => client.messages.create({
      body: TEXTS.text,
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${number}`,
    }));

    const sends = await Promise.all(messages);

    sends.forEach((send) => console.log(send.direction, send.status, send.sid));
  } catch (error) {
    console.error(error);
  }
};

cron.schedule('*/10 * * * *', findText);

console.log('Cron job started');
