const puppeteer = require('puppeteer');

function fetchPageLinks() {
    return Array.from(document.querySelectorAll('div.item div.item-content')).
            map((product) => ({category:product.querySelector('ul.item-details li').innerText,
                                link:product.querySelector('big.item-title a').href}))
}

// I get the links of the books 
// on all pages according to the number of pages specified.
async function fetchBookLinks(page,pageCount) { 
    let mainLinks = [];
    for(let count=0;count<pageCount;count++) {
        let tmpLinks =await page.evaluate(fetchPageLinks);
        mainLinks = [...mainLinks,...tmpLinks];
        let link = await page.evaluate(() => document.querySelector('ul.pager li.next a').href);
        await page.goto(link);
    }

    return mainLinks;
}

(async () => {
    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();

    await page.goto('https://www.bookrix.com/books;lang:en.html');

    const enlaces = await fetchBookLinks(page,10);
    
    console.log(enlaces.length);
    
    const books = []
    for(let enlace of enlaces){
        if(enlace.category != 'Erotic' && enlace.category != 'Short Story'){
            await page.goto(enlace.link);
            let book = await page.evaluate(() => {
                let tmp = {};
                tmp.title = document.querySelector('div#booktitle h2').innerText;
                tmp.author = document.querySelector('span#authortext a').innerText;
                tmp.image = document.querySelector('div#bookIcon a img').src;
                tmp.description = document.querySelector('div#bookbody div#blurb').innerText;
                tmp.category = document.querySelector('div#bars ul.navbar li a').innerText;
                tmp.readLink = document.querySelector('div#bookfree a').href;

                return tmp;
            })

            books.push(book);
        }

            //addDataToDb(laptop);
        //}
    }

    console.log(books);
    await browser.close();

})();