import { promises as fs } from "fs";

async function main() {
    const j: any[] = JSON.parse(
        await fs.readFile("./data/noType.json", {
            encoding: "utf-8",
        })
    );

    const newObj = {};
    const data = j.map((e) => e.publications);

    // Combine the list of objects into new Object whre each object has a key of the category and publications as an array of objects

    // data.forEach(e => {
    //     e.forEach(pub => {

    // await fs.writeFile("./data/resultsTag.json", bibtex, {
    //     encoding: "utf-8",
    // });
}

main();
