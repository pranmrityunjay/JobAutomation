const pup = require("puppeteer");
let { id, pass } = require("./secret");
let tab;
let dataFile = require("./data");

async function main() {
    try {
        let browser = await pup.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized"],
        });

        let pages = await browser.pages();
        tab = pages[0];

        await tab.goto("https://internshala.com/");
        
        await tab.waitForSelector('.login-cta', { timeout: 6000 });
        await tab.click('.login-cta');

        await tab.waitForSelector('#login-modal', { visible: true });
        await tab.type("#modal_email", id);
        await tab.type("#modal_password", pass);
        await tab.click("#modal_login_submit");

        await tab.waitForNavigation({ waitUntil: "networkidle2" });
        
        let resumeUrl = "/student/resume?detail_source=resume_direct";
        await tab.goto("https://internshala.com" + resumeUrl);

        await new Promise(resolve => setTimeout(resolve, 6000));

        const data = dataFile[0];
        
        async function clearAndType(selector, value) {
            try {
                await tab.waitForSelector(selector, { visible: true });
                await tab.click(selector);
                await tab.keyboard.down('Control'); 
                await tab.keyboard.press('A');
                await tab.keyboard.up('Control');
                await tab.keyboard.press('Backspace');
                await tab.type(selector, value);
                console.log(`Updated ${selector} with value: ${value}`);
                await new Promise(resolve => setTimeout(resolve, 500)); 
            } catch (error) {
                console.error(`Error clearing and typing in ${selector}:`, error);
            }
        }

        try {
            await tab.waitForSelector('#edit-education', { timeout: 6000 });
            await tab.click('#edit-education');

            await tab.waitForSelector('#college-modal', { visible: true });

            await clearAndType("#college", data.College);
            await clearAndType("#degree", data.Degree);
            await clearAndType("#stream", data.Stream);

            await tab.click("#college-submit");
            console.log("Education details submitted.");
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error("Error updating education details:", error);
        }

        try {
            await tab.waitForSelector('#edit-por', { timeout: 12000 });
            await tab.click('#edit-por');

            await tab.waitForSelector('#por-modal', { visible: true });
            await clearAndType("#other_experiences_por_description", data.description);
            await tab.click("#por-submit");
            console.log("Other experiences updated successfully!");
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for submission to process

        } catch (error) {
            console.error("Error updating other experiences:", error);
        }

        await application(data);

    } catch (error) {
        console.error("Error in main function:", error);
    }
}

async function application(data) {
    try {
        await tab.goto("https://internshala.com/internships/");
        
        await tab.waitForSelector("#internship_list_container", { visible: true });

        await new Promise(resolve => setTimeout(resolve, 2000)); // Extra delay for safety

        let internshipElements = await tab.$$(".individual_internship");
        
        console.log(`Found ${internshipElements.length} internship elements.`); 

        let detailUrl = [];

        for (let i = 0; i < Math.min(5, internshipElements.length); i++) { 
            let url = await tab.evaluate(ele => {
                let anchor = ele.querySelector(".job-title-href");
                return anchor ? anchor.getAttribute("href") : null;
            }, internshipElements[i]);
            
            if (url) {
                detailUrl.push(url);
                console.log(`Found URL: ${url}`);
            } else {
                console.log("URL not found for this internship element.");
            }
        }

        for (let url of detailUrl) {
            if (url) {
                await applyInternship(url, data);
                await new Promise(resolve => setTimeout(resolve, 1000)); 
            } else {
                console.log("Skipping null URL.");
            }
        }

        console.log("Applied to internships successfully!");

    } catch (error) {
        console.error("Error in application function:", error);
    }
}

async function applyInternship(url, data) {
    try {
        await tab.goto("https://internshala.com/" + url);
        await tab.waitForSelector(".btn.btn-large", { visible: true });
        await tab.click(".btn.btn-large");

        await tab.waitForSelector('.proceed-btn-container .btn.btn-large.proceed-btn', { visible: true, timeout: 10000 });
        await tab.click('.proceed-btn-container .btn.btn-large.proceed-btn');
        console.log("Clicked on 'Proceed to application' button.");

        await tab.waitForSelector('#cover_letter', { visible: true });
        await tab.type('#cover_letter', data.hiringReason);
        console.log("Filled in the cover letter with your skills.");

        const answerSelectors = await tab.$$(".additional_information_container textarea");
        const answers = [data.hiringReason, data.availability, data.rating];

        for (let i = 0; i < answers.length && i < answerSelectors.length; i++) {
            await answerSelectors[i].type(answers[i]);
            await new Promise(resolve => setTimeout(resolve, 1000)); 
        }

        await tab.click(".submit_button_container button");
        console.log(`Applied to internship: ${url}`);

    } catch (error) {
        console.error("Error applying to internship:", error);
    }
}

main();
