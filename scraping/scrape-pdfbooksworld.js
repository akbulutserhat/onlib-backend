const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Book = require('../models/book.js');
require('dotenv').config({path:__dirname+'/./../.env'});


function fetchPageLinks() {
    return Array.from(document.querySelectorAll('div.product-list div.product-thumb div.image')).
            map((product) => product.querySelector('a').href)
}

// Getting the links of the books 
// on all pages according to the number of pages specified.
async function fetchBookLinks(page,pageCount) { 
    let mainLinks = [];
    for(let count=0;count<pageCount;count++) {
        let tmpLinks =await page.evaluate(fetchPageLinks);
        mainLinks = [...mainLinks,...tmpLinks];
        let link = await page.evaluate(() => document.querySelector('ul.pagination li:nth-last-child(2) a').href);
        await page.goto(link);
        await page.waitForTimeout(400);
    }

    return mainLinks;
}

(async () => {
    await mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true,useUnifiedTopology:true});
    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();

    await page.goto('https://www.pdfbooksworld.com/books');

    const enlaces = await fetchBookLinks(page,125);

    for(let enlace of enlaces){
        
        await page.goto(enlace);
        await page.waitForTimeout(500);
        let book = await page.evaluate(() => {
            let tmp = {};
            tmp.title = document.querySelector('div#content div.col-sm-8 h1').innerText;
            tmp.author = document.querySelector('div#content div.col-sm-8 h2 em').innerText;
            tmp.image = document.querySelector('ul.thumbnails li a img').src;
            tmp.descriptions = Array.from(document.querySelectorAll('div.tab-content div#tab-description p'))
                                                                    .map(product => product.innerText);
            tmp.categories = Array.from(document.querySelectorAll('div#tab-description > a'))
                                                                    .map(product => product.innerText);
            tmp.readLink = document.querySelector('div#tab-read a').href;

            return tmp;
        })

        const dbBook = new Book(book);

        dbBook.save();
    }

    await browser.close();

})();