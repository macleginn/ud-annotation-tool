const UDFields = ['ID', 'FORM', 'LEMMA', 'UPOS', 'XPOS', 'FEATS', 'HEAD', 'DEPREL', 'DEPS', 'MISC'];

let conllu = {};

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function get(obj, key, plug) {
    return obj.hasOwnProperty(key) ? obj[key] : plug;
}

function byId(id) {
    return document.getElementById(id);
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

function printConllu() {
    let tmp = [];
    tmp.push(`# docid = ${get(conllu, 'docid', '')}`);
    tmp.push(`# sent_id = ${get(conllu, 'sent_id', '')}`);
    tmp.push(`# text = ${get(conllu, 'text', '')}`);
    tmp.push(`# tokenised = ${get(conllu, 'tokenised', '').join(' ')}`);
    const wordLines = get(conllu, 'wordLines', []);
    for (const line of wordLines)
        tmp.push(UDFields.map(field => line[field]).join('\t'));
    return tmp.join('\n');
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

const testBlock = `# sent_id = 1
# text = \`\` I have no greater obligation than to ensure the safely of airline travelers in this country , '' Transportation Secretary Ray LaHood said in a joint statement with J. Randolph Babbitt , administrator of the Federal Aviation Administration , that was issued on the eve of a Senate hearing on aviation safety .
# docid = NYT_ENG_20090610.0010
# tokenised = \`\` I have no greater obligation than to ensure the safely of airline travelers in this country , '' Transportation Secretary Ray LaHood said in a joint statement with J. Randolph Babbitt , administrator of the Federal Aviation Administration , that was issued on the eve of a Senate hearing on aviation safety .
1\t\`\`\t\`\`\tPUNCT\t\`\`\tPunctType=quot|PunctSide=ini\t24\tpunct\t_\t_
2\tI\tI\tPRON\tPRP\tPronType=prs\t3\tnsubj\t_\t_
3\thave\thave\tVERB\tVBP\tVerbForm=fin|Tense=pres\t24\tccomp\t_\t_
4\tno\tno\tDET\tDT\t_\t6\tdet\t_\t_
5\tgreater\tgreater\tADJ\tJJR\tDegree=comp\t6\tamod\t_\t_
6\tobligation\tobligation\tNOUN\tNN\tNumber=sing\t3\tobj\t_\t_
7\tthan\tthan\tSCONJ\tIN\t_\t9\tmark\t_\t_
8\tto\tto\tPART\tTO\tPartType=inf|VerbForm=inf\t9\tmark\t_\t_
9\tensure\tensure\tVERB\tVB\tVerbForm=inf\t6\tacl\t_\t_
10\tthe\tthe\tDET\tDT\t_\t11\tdet\t_\t_
11\tsafely\tsafely\tNOUN\tNN\tNumber=sing\t9\tobj\t_\t_
12\tof\tof\tADP\tIN\t_\t14\tcase\t_\t_
13\tairline\tairline\tNOUN\tNN\tNumber=sing\t14\tcompound\t_\t_
14\ttravelers\ttraveler\tNOUN\tNNS\tNumber=plur\t11\tnmod\t_\t_
15\tin\tin\tADP\tIN\t_\t17\tcase\t_\t_
16\tthis\tthis\tDET\tDT\t_\t17\tdet\t_\t_
17\tcountry\tcountry\tNOUN\tNN\tNumber=sing\t14\tnmod\t_\t_
18\t,\t,\tPUNCT\t,\tPunctType=comm\t24\tpunct\t_\t_
19\t''\t''\tPUNCT\t''\tPunctType=quot|PunctSide=fin\t24\tpunct\t_\t_
20\tTransportation\tTransportation\tPROPN\tNNP\tNounType=prop|Number=sing\t21\tcompound\t_\t_
21\tSecretary\tSecretary\tPROPN\tNNP\tNounType=prop|Number=sing\t22\tcompound\t_\t_
22\tRay\tRay\tPROPN\tNNP\tNounType=prop|Number=sing\t24\tnsubj\t_\t_
23\tLaHood\tLaHood\tPROPN\tNNP\tNounType=prop|Number=sing\t22\tflat\t_\t_
24\tsaid\tsay\tVERB\tVBD\tVerbForm=fin|Tense=past\t0\troot\t_\t_
25\tin\tin\tADP\tIN\t_\t28\tcase\t_\t_
26\ta\ta\tDET\tDT\t_\t28\tdet\t_\t_
27\tjoint\tjoint\tADJ\tJJ\tDegree=pos\t28\tamod\t_\t_
28\tstatement\tstatement\tNOUN\tNN\tNumber=sing\t24\tobl\t_\t_
29\twith\twith\tADP\tIN\t_\t30\tcase\t_\t_
30\tJ.\tJ.\tPROPN\tNNP\tNounType=prop|Number=sing\t28\tnmod\t_\t_
31\tRandolph\tRandolph\tPROPN\tNNP\tNounType=prop|Number=sing\t30\tflat\t_\t_
32\tBabbitt\tBabbitt\tPROPN\tNNP\tNounType=prop|Number=sing\t30\tflat\t_\t_
33\t,\t,\tPUNCT\t,\tPunctType=comm\t30\tpunct\t_\t_
34\tadministrator\tadministrator\tNOUN\tNN\tNumber=sing\t30\tappos\t_\t_
35\tof\tof\tADP\tIN\t_\t39\tcase\t_\t_
36\tthe\tthe\tDET\tDT\t_\t39\tdet\t_\t_
37\tFederal\tFederal\tPROPN\tNNP\tNounType=prop|Number=sing\t38\tcompound\t_\t_
38\tAviation\tAviation\tPROPN\tNNP\tNounType=prop|Number=sing\t39\tcompound\t_\t_
39\tAdministration\tAdministration\tPROPN\tNNP\tNounType=prop|Number=sing\t34\tnmod\t_\t_
40\t,\t,\tPUNCT\t,\tPunctType=comm\t30\tpunct\t_\t_
41\tthat\tthat\tPRON\tWDT\t_\t43\tnsubj:pass\t_\t_
42\twas\tbe\tAUX\tVBD\tVerbForm=fin|Tense=past\t43\taux:pass\t_\t_
43\tissued\tissue\tVERB\tVBN\tVerbForm=part|Tense=past|Aspect=perf\t28\tacl:relcl\t_\t_
44\ton\ton\tADP\tIN\t_\t46\tcase\t_\t_
45\tthe\tthe\tDET\tDT\t_\t46\tdet\t_\t_
46\teve\teve\tNOUN\tNN\tNumber=sing\t43\tobl\t_\t_
47\tof\tof\tADP\tIN\t_\t50\tcase\t_\t_
48\ta\ta\tDET\tDT\t_\t50\tdet\t_\t_
49\tSenate\tSenate\tPROPN\tNNP\tNounType=prop|Number=sing\t50\tcompound\t_\t_
50\thearing\thearing\tNOUN\tNN\tNumber=sing\t46\tnmod\t_\t_
51\ton\ton\tADP\tIN\t_\t53\tcase\t_\t_
52\taviation\taviation\tNOUN\tNN\tNumber=sing\t53\tcompound\t_\t_
53\tsafety\tsafety\tNOUN\tNN\tNumber=sing\t50\tnmod\t_\t_
54\t.\t.\tPUNCT\t.\tPunctType=peri\t24\tpunct\t_\tSpaceAfter=No`;

document.addEventListener('DOMContentLoaded', () => {
    conllu = processBlock(testBlock);
    byId('docid').value = conllu.docid;
    byId('sent_id').value = conllu.sent_id;
    m.mount(byId('annotation'), parseComponent);
    m.redraw();
});