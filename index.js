const express = require("express");
const fs = require("fs");
const PDFDocument = require('pdfkit');
const multer = require('multer');
const PNG = require('pngjs').PNG;

const PORT = process.env.PORT || 3000;
const app = express();

const authorText = "Image Text Poster ";
const directories = [
    "./temp_img",
    "./temp_pdf",
    "./temp_txt",
];
const charsContToFontSize = {
    4: {
        "width": 340,
        "height": 120,
    },
    6: {
        "width": 230,
        "height": 78,
    },
    8: {
        "width": 170,
        "height": 63,
    }
};
const ic = {
    "1": 1,
    "1/2": 2,
    "1/3": 3,
    "1/4": 4,
};
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './temp_img/');
    },
    filename: function (req, file, cb) {
        let fName = file.originalname
            .toLowerCase()
            .replace(" ", "_")
            .split(".")
            .join("")
            .substring(0, file.originalname.split(".").join("").length - 3) + ".png";

        cb(null, Date.now() + "_" + fName);
    }
});
const upload = multer({storage: storage});

directories.forEach(d => {
    if (!fs.existsSync(d)) {
        fs.mkdirSync(d);
    }
});

app.use(express.static("static"));

app.post("/tip", upload.single('imgToPoster'), async (req, res) => {
    let fileName = req.file.filename.split('.')[0];
    const removeFiles = () => {
        let pdfFilePath = `${__dirname}/temp_pdf/${fileName}.pdf`;
        let imgFilePath = `${__dirname}/temp_img/${fileName}.png`;
        let txtFilePath = `${__dirname}/temp_txt/${fileName}.txt`;
        if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
        if (fs.existsSync(imgFilePath)) fs.unlinkSync(imgFilePath);
        if (fs.existsSync(txtFilePath)) fs.unlinkSync(txtFilePath);
    };

    try {
        console.log(req.file);
        if (req.file.size > 1154376) {
            removeFiles();
            res.statusCode = 200;
            res.json(
                JSON.stringify({
                    "invalidImage": true,
                    "oversize": true,
                    "fileName": fileName
                })
            );
            return;
        }

        ConvertImageToText(fileName, ic[req.body.imageCompressing]);
        ConvertTextToPdf(fileName, +req.body.fontSize);

        res.statusCode = 200;
        res.json(
            JSON.stringify({
                "invalidImage": false,
                "oversize": false,
                "fileName": fileName
            })
        );
    } catch (e) {
        removeFiles();
        res.statusCode = 200;
        res.json(
            JSON.stringify({
                "invalidImage": true,
                "oversize": false,
                "fileName": fileName
            })
        );
    }
});
app.get("/pdf/*", async (req, res) => {
    let fileName = req.originalUrl.split('/')[2];

    if (fs.existsSync(`${__dirname}/temp_img/${fileName}.png`)) {
        let pdfFilePath = `${__dirname}/temp_pdf/${fileName}.pdf`;
        let imgFilePath = `${__dirname}/temp_img/${fileName}.png`;
        let txtFilePath = `${__dirname}/temp_txt/${fileName}.txt`;

        let file = fs.createReadStream(pdfFilePath);
        file.on("end", function () {
            fs.unlink(pdfFilePath, (err) => {
                if (!!err)
                    console.log(err);
            });
            fs.unlink(imgFilePath, (err) => {
                if (!!err)
                    console.log(err);
            });
            fs.unlink(txtFilePath, (err) => {
                if (!!err)
                    console.log(err);
            });
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
        file.pipe(res);
    } else {
        res.status(404).sendFile(`${__dirname}/404.html`);
    }
});
app.get('*', async (req, res) => res.status(404).sendFile(`${__dirname}/404.html`));

app.listen(PORT, () => console.log("server started | listening at " + PORT));

const ConvertImageToText = (fileName, imageStep = 4) => {
    const GetTextPixelFromGreyScale = (scale) => {
        if (scale > 233.75) {
            return "##";
        } else if (scale > 212.5) {
            return "WW";
        } else if (scale > 191.25) {
            return "GG";
        } else if (scale > 170) {
            return "CC";
        } else if (scale > 148.75) {
            return "??";
        } else if (scale > 127.5) {
            return "[]";
        } else if (scale > 106.25) {
            return "//";
        } else if (scale > 85) {
            return "==";
        } else if (scale > 63.75) {
            return "::";
        } else if (scale > 42.5) {
            return "--";
        } else if (scale > 21.25) {
            return "..";
        } else {
            return "  ";
        }
    };

    let data = fs.readFileSync(`./temp_img/${fileName}.png`);
    let png = PNG.sync.read(data);
    let textImage = "";

    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            let idx = (png.width * y + x) << 2;

            let red = png.data[idx];
            let green = png.data[idx + 1];
            let blue = png.data[idx + 2];
            let alpha = png.data[idx + 3];

            let grayScaleColor = (red + green + blue + alpha) / 4;

            if (x % imageStep === 0 && y % imageStep === 0) {
                textImage += alpha === 255 ? GetTextPixelFromGreyScale(grayScaleColor) : "  ";
            }
        }
        if (y % imageStep === 0) {
            textImage += "\n";
        }
    }

    textImage = textImage.slice(0, textImage.length - authorText.length - 1);
    textImage += authorText;

    fs.writeFileSync(`./temp_txt/${fileName}.txt`, textImage, (err) => {
        if (err) console.log(err);
    });
};
const ConvertTextToPdf = (fileName, fontSize = 6) => {
    let text = fs.readFileSync(`./temp_txt/${fileName}.txt`, "UTF-8");

    let lengthWidth = text.split("\n")[0].length / charsContToFontSize[fontSize]["width"];
    let lengthHeight = text.split("\n").length / charsContToFontSize[fontSize]["height"];

    const widthPages = lengthWidth % 1 > 0 ? (lengthWidth | 0) + 1 : lengthWidth;
    const heightPages = lengthHeight % 1 > 0 ? (lengthHeight | 0) + 1 : lengthHeight;

    let textMatrix = [];
    for (let i = 0; i < widthPages; i++) {
        textMatrix[i] = [];
        for (let j = 0; j < heightPages; j++) {
            textMatrix[i][j] = "";
        }
    }

    let w = 1;
    let h = 1;
    let lineNum = 1;
    let inLineChars = 1;
    for (let i = 0; i < text.length - 1; i++) {
        if (text[i] === "\n") {
            w = 1;
            inLineChars = 1;
            lineNum++;
        }

        let ddd = true;
        if (text[i] === '\n' && (lineNum + 1) % charsContToFontSize[fontSize]["height"] === 0) {
            h++;
            ddd = false;
        }

        if (inLineChars % charsContToFontSize[fontSize]["width"] === 0) {
            w++;
            if ((lineNum - 1) % charsContToFontSize[fontSize]["height"] !== 0) {
                textMatrix[w - 1][h - 1] += "\n";
            }
        }

        inLineChars++;
        if (ddd) {
            textMatrix[w - 1][h - 1] += text[i];
        } else {
            lineNum += 2;
        }
    }

    const doc = new PDFDocument({
        layout: 'landscape',
        margin: 0,
    });
    doc.info["Title"] = "itp_" + fileName.substring(fileName.indexOf("_") + 1);
    doc.info["Author"] = "(Image Text Poster)";

    doc.pipe(fs.createWriteStream(`./temp_pdf/${fileName}.pdf`));
    for (let i = 0; i < textMatrix.length; i++) {
        for (let j = 0; j < textMatrix[i].length; j++) {
            if (!!textMatrix[i][j]) {
                if (textMatrix[i][j].indexOf("undefined") === -1) {
                    if (i === 0 && j === 0) {
                        doc.font(`${__dirname}/CONSOLAB.TTF`)
                            .fontSize(fontSize)
                            .text(textMatrix[i][j]);
                    } else {
                        doc.addPage()
                            .font(`${__dirname}/CONSOLAB.TTF`)
                            .fontSize(fontSize)
                            .text(textMatrix[i][j].indexOf("undefined") === -1 ? textMatrix[i][j] : textMatrix[i][j].substring(1, textMatrix[i][j].length));
                    }
                }
            }
        }
    }
    doc.end();
};