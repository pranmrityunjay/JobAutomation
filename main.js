
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


        // try {
        //     await tab.waitForSelector('#edit-education', { timeout: 6000 });
        //     await tab.click('#edit-education');

        //     await tab.waitForSelector('#college-modal', { visible: true });

        //     await clearAndType("#college", data.College);
        //     await clearAndType("#degree", data.Degree);
        //     await clearAndType("#stream", data.Stream);

        //     await tab.click("#college-submit");
        //     console.log("Education details submitted.");
        //     await new Promise(resolve => setTimeout(resolve, 2000));

        // } catch (error) {
        //     console.error("Error updating education details:", error);
        // }

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

        try {
            await tab.waitForSelector('#edit-project', { timeout: 6000 });
            await tab.click('#edit-project');

            await tab.waitForSelector('#project-modal', { visible: true });

            await clearAndType("#other_experiences_title", data.ProjectName);
            await clearAndType("#other_experiences_project_description", data.ProjectName_Description);
            // await clearAndType("#stream", data.Stream);

            await tab.click("#project-submit");
            console.log("Education details submitted.");
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error("Error updating education details:", error);
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
        await new Promise(resolve => setTimeout(resolve, 2000));

        let internshipElements = await tab.$$(".individual_internship");

        console.log(`Found ${internshipElements.length} internship elements.`);

        let detailUrl = [];

        // Collect URLs of internships (limit to 2 for testing, or more as needed)
        for (let i = 0; i < Math.min(6, internshipElements.length); i++) {
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

        // Apply to each internship
        for (let url of detailUrl) {
            if (url) {
                await applyInternship(url, data);
                await tab.goto("https://internshala.com/internships/");
                await tab.waitForSelector("#internship_list_container", { visible: true });
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for internships list to load
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
    console.log("Applying to internship at URL:", url);
    try {
        await tab.goto("https://internshala.com/" + url);

        await tab.waitForSelector(".btn.btn-large", { visible: true });
        await tab.click(".btn.btn-large");
        await new Promise(resolve => setTimeout(resolve, 2000));

        const coverLetterSelector = '#cover_letter';
        const coverLetterField = await tab.$(coverLetterSelector);

        if (coverLetterField) {
            await tab.evaluate(() => {
                const textarea = document.getElementById('cover_letter');
                textarea.style.display = 'block';
                textarea.style.overflow = 'visible';
            });

            await tab.evaluate((text) => {
                document.getElementById('cover_letter').value = text;
            }, "Hello, I'm interested in this opportunity.");
            console.log("Filled in the cover letter.");
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            console.log("Cover letter field not found, skipping...");
        }

        const locationCheckboxSelector = '#check';
        const locationCheckbox = await tab.$(locationCheckboxSelector);

        if (locationCheckbox) {
            await tab.click(locationCheckboxSelector);
            console.log("Marked location choose as 'yes'.");
            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            console.log("Location choose checkbox not found, skipping...");
        }

        await tab.click(".submit_button_container #submit");
        console.log(`Applied to internship: ${url}`);
        await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
        console.error("Error applying to internship:", error);
    }
}


main(); 
