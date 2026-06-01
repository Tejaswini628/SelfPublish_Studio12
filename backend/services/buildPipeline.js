const supabase = require('../config/supabase');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { getLocalFileUrl, isLocalFilePath, readLocalFile, saveLocalFile } = require('./localFiles');

const run = promisify(execFile);

const FORMATS = [
    { format: 'epub', ext: '.epub', mime: 'application/epub+zip' },
    { format: 'pdf', ext: '.pdf', mime: 'application/pdf' },
    { format: 'xhtml', ext: '.xhtml', mime: 'application/xhtml+xml' },
    { format: 'tex', ext: '.tex', mime: 'application/x-tex' },
    { format: 'lint', ext: '.txt', mime: 'text/plain' },
    { format: 'diff', ext: '.patch', mime: 'text/plain' }
];

const COMMON_SOFFICE_PATHS = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
];

async function updateStatus(bookId, status) {
    const { error } = await supabase
        .from('books')
        .update({ status })
        .eq('id', bookId);
    if (error) console.error('[Build] Status update error:', error);
}

async function commandExists(command) {
    try {
        await run(command, ['--version'], { timeout: 10000 });
        return true;
    } catch {
        return false;
    }
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function resolvePandoc() {
    if (process.env.PANDOC_PATH && await fileExists(process.env.PANDOC_PATH)) {
        return process.env.PANDOC_PATH;
    }

    return await commandExists('pandoc') ? 'pandoc' : null;
}

async function resolveSoffice() {
    if (process.env.SOFFICE_PATH && await fileExists(process.env.SOFFICE_PATH)) {
        return process.env.SOFFICE_PATH;
    }

    if (await commandExists('soffice')) return 'soffice';
    if (await commandExists('libreoffice')) return 'libreoffice';

    for (const candidate of COMMON_SOFFICE_PATHS) {
        if (await fileExists(candidate)) return candidate;
    }

    return null;
}

async function downloadManuscript(manuscriptPath, outputPath) {
    if (isLocalFilePath(manuscriptPath)) {
        await fs.writeFile(outputPath, await readLocalFile(manuscriptPath));
        return;
    }

    const { data, error } = await supabase.storage
        .from('manuscripts')
        .download(manuscriptPath);

    if (error) throw error;
    if (!data) throw new Error('Manuscript download returned no data');

    await fs.writeFile(outputPath, Buffer.from(await data.arrayBuffer()));
}

async function saveBuildFile(bookId, version, fmt) {
    const filePath = `builds/build_${bookId}_v${version}_${fmt.format}${fmt.ext}`;
    await saveLocalFile(filePath, fmt.content);
    return getLocalFileUrl(filePath);
}

async function convertWithPandoc(pandoc, inputPath, outputPath, extraArgs = []) {
    await run(pandoc, [inputPath, ...extraArgs, '-o', outputPath], {
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 10
    });
}

async function convertPdfWithLibreOffice(soffice, inputPath, outputPath, workDir) {
    await run(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', workDir, inputPath], {
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 10
    });

    const libreOfficeOutput = path.join(workDir, `${path.basename(inputPath, path.extname(inputPath))}.pdf`);
    if (libreOfficeOutput !== outputPath) {
        await fs.rename(libreOfficeOutput, outputPath);
    }
}

function getZipEntry(buffer, entryName) {
    for (let i = buffer.length - 22; i >= 0; i -= 1) {
        if (buffer.readUInt32LE(i) !== 0x06054b50) continue;

        const centralDirectorySize = buffer.readUInt32LE(i + 12);
        const centralDirectoryOffset = buffer.readUInt32LE(i + 16);
        let offset = centralDirectoryOffset;
        const end = centralDirectoryOffset + centralDirectorySize;

        while (offset < end && buffer.readUInt32LE(offset) === 0x02014b50) {
            const method = buffer.readUInt16LE(offset + 10);
            const compressedSize = buffer.readUInt32LE(offset + 20);
            const fileNameLength = buffer.readUInt16LE(offset + 28);
            const extraLength = buffer.readUInt16LE(offset + 30);
            const commentLength = buffer.readUInt16LE(offset + 32);
            const localHeaderOffset = buffer.readUInt32LE(offset + 42);
            const fileName = buffer.toString('utf8', offset + 46, offset + 46 + fileNameLength);

            if (fileName === entryName) {
                const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
                const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
                const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
                const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);

                if (method === 0) return compressed;
                if (method === 8) return zlib.inflateRawSync(compressed);
                throw new Error(`Unsupported ODT zip compression method: ${method}`);
            }

            offset += 46 + fileNameLength + extraLength + commentLength;
        }
    }

    throw new Error(`ODT is missing ${entryName}`);
}

function decodeXml(text) {
    return text
        .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
}

function extractTextFromOdt(buffer) {
    const xml = getZipEntry(buffer, 'content.xml').toString('utf8');
    const body = xml
        .replace(/<text:line-break\s*\/>/g, '\n')
        .replace(/<text:tab\s*\/>/g, '\t')
        .replace(/<text:s(?:\s+text:c="(\d+)")?\s*\/>/g, (_match, count) => ' '.repeat(Number(count || 1)))
        .replace(/<\/text:h>/g, '\n\n')
        .replace(/<\/text:p>/g, '\n\n')
        .replace(/<text:h\b[^>]*>/g, '')
        .replace(/<text:p\b[^>]*>/g, '')
        .replace(/<[^>]+>/g, '');

    return decodeXml(body)
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeTex(text) {
    return text
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/([#$%&_{}])/g, '\\$1')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/~/g, '\\textasciitilde{}');
}

function escapePdfText(text) {
    return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapText(text, width = 88) {
    const output = [];
    for (const paragraph of text.split(/\n{2,}/)) {
        let line = '';
        for (const word of paragraph.replace(/\s+/g, ' ').trim().split(' ')) {
            if (!word) continue;
            if (`${line} ${word}`.trim().length > width) {
                output.push(line);
                line = word;
            } else {
                line = `${line} ${word}`.trim();
            }
        }
        if (line) output.push(line);
        output.push('');
    }
    return output;
}

function createPdf(text, title) {
    const lines = wrapText(text || 'No extractable text found in the uploaded ODT.', 82);
    const linesPerPage = 44;
    const pages = [];

    for (let i = 0; i < lines.length; i += linesPerPage) {
        pages.push(lines.slice(i, i + linesPerPage));
    }

    const objects = [];
    const addObject = content => {
        objects.push(content);
        return objects.length;
    };

    const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const pageIds = [];

    for (const pageLines of pages) {
        const commands = ['BT', '/F1 11 Tf', '54 760 Td', '14 TL'];
        commands.push(`(${escapePdfText(title)}) Tj`, 'T*', 'T*');
        for (const line of pageLines) {
            commands.push(`(${escapePdfText(line)}) Tj`, 'T*');
        }
        commands.push('ET');

        const stream = commands.join('\n');
        const contentId = addObject(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
        pageIds.push(addObject(`<< /Type /Page /Parent PAGES_REF /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`));
    }

    const pagesId = addObject(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
    const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    const resolvedObjects = objects.map(object => object.replace(/PAGES_REF/g, `${pagesId} 0 R`));

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    resolvedObjects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${resolvedObjects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(offset => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${resolvedObjects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(pdf);
}

function createXhtml(text, title) {
    const paragraphs = (text || 'No extractable text found in the uploaded ODT.')
        .split(/\n{2,}/)
        .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
        .join('\n');

    return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>body{font-family:Georgia,serif;line-height:1.6;max-width:40em;margin:2em auto;padding:0 1em;}h1{font-size:2em;}</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${paragraphs}
</body>
</html>`);
}

function createTex(text, title) {
    const body = escapeTex(text || 'No extractable text found in the uploaded ODT.')
        .split(/\n{2,}/)
        .join('\n\n');

    return Buffer.from(`\\documentclass[12pt]{book}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper,margin=1in}
\\title{${escapeTex(title)}}
\\date{}
\\begin{document}
\\maketitle

${body}

\\end{document}
`);
}

const CRC_TABLE = Array.from({ length: 256 }, (_value, index) => {
    let crc = index;
    for (let k = 0; k < 8; k += 1) {
        crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    return crc >>> 0;
});

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function createZip(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const entry of entries) {
        const name = Buffer.from(entry.name);
        const source = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content);
        const method = entry.store ? 0 : 8;
        const content = entry.store ? source : zlib.deflateRawSync(source);
        const crc = crc32(source);

        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0, 6);
        local.writeUInt16LE(method, 8);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(content.length, 18);
        local.writeUInt32LE(source.length, 22);
        local.writeUInt16LE(name.length, 26);

        localParts.push(local, name, content);

        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(0, 8);
        central.writeUInt16LE(method, 10);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(content.length, 20);
        central.writeUInt32LE(source.length, 24);
        central.writeUInt16LE(name.length, 28);
        central.writeUInt32LE(offset, 42);
        centralParts.push(central, name);

        offset += local.length + name.length + content.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(centralDirectory.length, 12);
    end.writeUInt32LE(offset, 16);

    return Buffer.concat([...localParts, centralDirectory, end]);
}

function createEpub(text, title, bookId) {
    const xhtml = createXhtml(text, title);
    const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeHtml(title)}</dc:title>
    <dc:identifier id="bookid">urn:uuid:${bookId}</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="content"/>
  </spine>
</package>`;

    return createZip([
        { name: 'mimetype', content: 'application/epub+zip', store: true },
        { name: 'META-INF/container.xml', content: '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>' },
        { name: 'OEBPS/content.opf', content: opf },
        { name: 'OEBPS/content.xhtml', content: xhtml }
    ]);
}

function generateLintReport(text, version) {
    const lines = text.split('\n');
    const longLines = lines.filter(line => line.length > 80).length;
    const trailingSpaces = lines.filter(line => line !== line.trimEnd()).length;
    const repeatedWords = (text.match(/\b(\w+)\s+\1\b/gi) || []).length;
    const totalWords = text.trim() ? text.trim().split(/\s+/).length : 0;

    return Buffer.from([
        'Self Publish Studio - Lint Report',
        '',
        `Version:   v${version}`,
        `Analyzed:  ${new Date().toISOString()}`,
        '',
        'STATISTICS',
        '----------',
        `Lines:           ${lines.length}`,
        `Words:           ${totalWords}`,
        `Characters:      ${text.length}`,
        '',
        'WARNINGS',
        '--------',
        `Line too long (>80 chars): ${longLines} line(s)`,
        `Trailing whitespace:       ${trailingSpaces} line(s)`,
        `Repeated words:            ${repeatedWords} occurrence(s)`,
        ''
    ].join('\n'));
}

function generateDiff(text, bookId, version) {
    const lines = text.split('\n').slice(0, 80);
    return Buffer.from([
        `From ${bookId} Mon Sep 17 00:00:00 2024`,
        'From: Self Publish Studio <studio@selfpublish.app>',
        `Date: ${new Date().toUTCString()}`,
        `Subject: [PATCH] Manuscript version ${version}`,
        '',
        'diff --git a/manuscript.odt b/manuscript.odt',
        'new file mode 100644',
        '--- /dev/null',
        '+++ b/manuscript.odt',
        `@@ -0,0 +1,${lines.length} @@`,
        ...lines.map(line => `+${line}`)
    ].join('\n'));
}

async function createFallbackFiles(bookId, version, inputPath) {
    const manuscript = await fs.readFile(inputPath);
    const text = extractTextFromOdt(manuscript);
    const title = `Book ${bookId}`;

    return {
        text,
        files: [
            { format: 'epub', content: createEpub(text, title, bookId) },
            { format: 'pdf', content: createPdf(text, title) },
            { format: 'xhtml', content: createXhtml(text, title) },
            { format: 'tex', content: createTex(text, title) },
            { format: 'lint', content: generateLintReport(text, version) },
            { format: 'diff', content: generateDiff(text, bookId, version) }
        ]
    };
}

async function createConvertedFiles(bookId, version, manuscriptPath) {
    const pandoc = await resolvePandoc();
    const soffice = await resolveSoffice();
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'self-publish-'));
    const inputPath = path.join(workDir, 'manuscript.odt');

    try {
        await downloadManuscript(manuscriptPath, inputPath);

        if (!pandoc) {
            const fallback = await createFallbackFiles(bookId, version, inputPath);
            return FORMATS.map(format => ({
                ...format,
                content: fallback.files.find(file => file.format === format.format).content
            }));
        }

        const outputPaths = {
            epub: path.join(workDir, 'book.epub'),
            pdf: path.join(workDir, 'book.pdf'),
            xhtml: path.join(workDir, 'book.xhtml'),
            tex: path.join(workDir, 'book.tex'),
            lint: path.join(workDir, 'lint.txt'),
            diff: path.join(workDir, 'diff.patch'),
            plain: path.join(workDir, 'book.txt')
        };

        await convertWithPandoc(pandoc, inputPath, outputPaths.epub);
        await convertWithPandoc(pandoc, inputPath, outputPaths.xhtml, ['-t', 'html5', '-s']);
        await convertWithPandoc(pandoc, inputPath, outputPaths.tex, ['-s']);
        await convertWithPandoc(pandoc, inputPath, outputPaths.plain, ['-t', 'plain']);

        const text = await fs.readFile(outputPaths.plain, 'utf8');
        if (soffice) {
            await convertPdfWithLibreOffice(soffice, inputPath, outputPaths.pdf, workDir);
        } else {
            await fs.writeFile(outputPaths.pdf, createPdf(text, `Book ${bookId}`));
        }
        await fs.writeFile(outputPaths.lint, generateLintReport(text, version));
        await fs.writeFile(outputPaths.diff, generateDiff(text, bookId, version));

        return Promise.all(
            FORMATS.map(async (fmt) => ({
                ...fmt,
                content: await fs.readFile(outputPaths[fmt.format])
            }))
        );
    } finally {
        await fs.rm(workDir, { recursive: true, force: true });
    }
}

async function runBuild(bookId, version, manuscriptPath) {
    console.log(`[Build] Starting build for book ${bookId}, version ${version}`);

    const { error: cleanupError } = await supabase
        .from('builds')
        .delete()
        .eq('book_id', bookId)
        .eq('version', version);

    if (cleanupError) {
        console.error('[Build] Cleanup error:', cleanupError);
    }

    const convertedFiles = await createConvertedFiles(bookId, version, manuscriptPath);

    for (const fmt of convertedFiles) {
        const publicUrl = await saveBuildFile(bookId, version, fmt);

        const { error: insertError } = await supabase
            .from('builds')
            .insert({
                book_id: bookId,
                version,
                format: fmt.format,
                file_url: publicUrl
            });

        if (insertError) {
            console.error(`[Build] DB insert error for ${fmt.format}:`, insertError);
        }

        console.log(`[Build] Completed ${fmt.format} for book ${bookId} v${version}`);
    }

    await updateStatus(bookId, 'completed');
    console.log(`[Build] Build complete for book ${bookId}, version ${version}`);
}

async function triggerBuild(bookId, version, manuscriptPath) {
    setTimeout(async () => {
        try {
            await runBuild(bookId, version, manuscriptPath);
        } catch (err) {
            console.error('[Build] Pipeline error:', err);
            await updateStatus(bookId, 'failed');
        }
    }, 0);
}

module.exports = { triggerBuild, runBuild };
