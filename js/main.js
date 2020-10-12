const UDFields = ['ID', 'FORM', 'LEMMA', 'UPOS', 'XPOS', 'FEATS', 'HEAD', 'DEPREL', 'DEPS', 'MISC'];
const requestURL = 'http://127.0.0.1:40000';

let conllu = {},
    currentRecordId = 0,
    suggestionsCache = {};

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function get(obj, key, plug) {
    return obj.hasOwnProperty(key) ? obj[key] : plug;
}

function byId(id) {
    return document.getElementById(id);
}

function prettifyInput() {
    let text = byId('raw-text').value;
    text = text.replace(/\s+/g, ' ')
        .replace(/\[.+?\]/g, '')
        .replace(/[|,:1-6890.]/g, '')
        .replace(/˙(\w)/g, '$1h');
    byId('raw-text').value = text;
}

function getUDWordLine(arr) {
    console.assert(arr.length === 10);
    return {
        ID:     arr[0],
        FORM:   arr[1],
        LEMMA:  arr[2],
        UPOS:   arr[3],
        XPOS:   arr[4],
        FEATS:  arr[5],
        HEAD:   arr[6],
        DEPREL: arr[7],
        DEPS:   arr[8],
        MISC:   arr[9]
    }
}

function processBlock(block) {
    const lines = block.split('\n');
    let result = {},
        wordLines = [];
    for (let line of lines) {
        line = line.trim();
        if (line.indexOf('# text = ') === 0)  // Text as is.
            result.text = line.slice('# text = '.length);
        else if (line.indexOf('# sent_id = ') === 0)
            result.sent_id = line.slice('# sent_id = '.length);
        else if (line.indexOf('# docid = ') === 0)
            result.docid = line.slice('# docid = '.length);
        else if (line.indexOf('# tokenised = ') === 0)  // Space-separated tokens.
            result.tokenised = line.slice('# tokenised = '.length).split(' ');
        else
            wordLines.push(getUDWordLine(line.split('\t')));
    }
    result.wordLines = wordLines;
    return result;
}

function initialiseParse(rawText, tokenisedText) {
    let result = {};
    result.docid = byId('docid').value;
    result.sent_id = byId('sent_id').value;
    result.text = rawText;
    result.tokenised = tokenisedText;
    const tokens = tokenisedText;
    let idx = 1,
        wordLines = [];
    for (const token of tokens) {
        wordLines.push(getUDWordLine([idx, token, '_', '_', '_', '_', '_', '_', '_', '_']));
        idx++;
    }
    result.wordLines = wordLines;
    return result;
}

function getTokens() {
    const rawText = byId('raw-text').value,
        tokenisedText = byId('tokenised-text').value.split(' ');
    conllu = initialiseParse(rawText, tokenisedText);
    m.redraw();
}

/**
 * Preserves the annotation for the tokens before the edit.
 * Hyphens inside word-forms are ignored to allow for glosses.
 */
function updateTokens() {
    const newTokens = byId('tokenised-text').value.split(' ');
    let i = 0;
    while (i < conllu.wordLines.length && i < newTokens.length) {
        if (conllu.wordLines[i].FORM.replace(/-/g, '') !== newTokens[i].replace(/-/g, ''))
            break;
        i++;
    }
    conllu.wordLines.length = i;
    while (i < newTokens.length) {
        conllu.wordLines.push(
            getUDWordLine([i+1, newTokens[i], '_', '_', '_', '_', '_', '_', '_', '_'])
        )
        i++;
    }
}

function printConllu() {
    let tmp = [];
    tmp.push(`# docid = ${get(conllu, 'docid', '')}`);
    tmp.push(`# sent_id = ${get(conllu, 'sent_id', '')}`);
    tmp.push(`# text = ${get(conllu, 'text', '')}`);
    tmp.push(`# tokenised = ${get(conllu, 'tokenised', []).join(' ')}`);
    const wordLines = get(conllu, 'wordLines', []);
    for (const line of wordLines)
        tmp.push(UDFields.map(field => line[field]).join('\t'));
    return tmp.join('\n');
}

async function showPrevious() {
    const corpus = byId('corpus-select').value;
    return showRecord(`${requestURL}/${corpus}/previousrecord/${currentRecordId}`);
}

async function showNext() {
    const corpus = byId('corpus-select').value;
    return showRecord(`${requestURL}/${corpus}/nextrecord/${currentRecordId}`);
}

async function showRecord(URL) {
    const response = await fetch(URL);
    if (!response.ok) {
        const message = await response.text();
        alert(`Failed to download the record: ${message}`);
        return null;
    }
    const data = await response.json();
    currentRecordId = data.id;
    conllu = processBlock(data.record);
    m.redraw();
}

/**
 * Taken from https://stackoverflow.com/a/36640126
 */
function copyToClipboard() {
    byId('copy-textarea').value = byId('conllu-pre').innerText;
    console.log(byId('copy-textarea').value);
    byId('copy-textarea').select();
    document.execCommand('copy');
}

function unverifiedValues() {
    if (conllu.wordLines === undefined)
        return true;
    for (const row of conllu.wordLines)
        for (const key in row)
            if (row.hasOwnProperty(key) && endswith(String(row[key]), ' ?'))
                return true;
    return false;
}

async function showById() {
    const id = byId('record-id-input').value;
    if (id === '' || isNaN(parseInt(id)))
        return;
    showRecord(`${requestURL}/byid/${id}`);
}

async function updateRecord() {
    const response = await fetch(`${requestURL}/updaterecord/${currentRecordId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
            docid: conllu.docid,
            sent_id: conllu.sent_id,
            record: printConllu()
        })
    });
    if (!response.ok) {
        const message = await response.text();
        alert(`Failed to update the record: ${message}`);
    } else {
        alert('Update successful');
        showById(currentRecordId);
    }
}

async function newRecord() {
    const response = await fetch(`${requestURL}/createrecord`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
            docid: conllu.docid,
            sent_id: conllu.sent_id,
            record: printConllu()
        })
    });
    if (!response.ok) {
        const message = await response.text();
        alert(`Failed to create a new record: ${message}`);
    } else {
        const newRecordId = await response.text();
        alert(`A new record was created with the ID ${new_record_id}`);
        currentRecordId = parseInt(newRecordId);
        showById(currentRecordId);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    m.mount(byId('annotation'), parseComponent);
    const response = await fetch(`${requestURL}/corpora`);
    if (!response.ok) {
        const message = await response.text();
        alert(`Failed to download the list of corpora: ${message}`);
        return;
    }
    const corpusList = await response.json();
    for (const corpus of corpusList) {
        let option = document.createElement('option');
        option.value = corpus;
        option.innerText = corpus;
        byId('corpus-select').appendChild(option);
    }
});