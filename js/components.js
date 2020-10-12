let firstTokenIdx = null, 
    secondTokenIdx = null,
    posTokIdx = null;

let parseComponent = {
    view: () => {
        return m(']', [
            m(textFieldsComponent),
            m('br'),
            m('div', enumerateTokens(conllu)),
            m('br'),
            m(UDVisualisationComponent),
            m('br'),
            m(conlluTableComponent),
            m('br'),
            m('input[type=button]', {
                value: 'Copy CoNLL-U to clipboard',
                onclick: e => {
                    e.redraw = false;
                    byId('copy-textarea').value = printConllu();
                    byId('copy-textarea').select();
                    document.execCommand('copy');
                }
            }),
            m('input[type=button]', {
                style: {'margin-left': '5px'},
                value: 'Update CoNNL-U',
                onclick: markCellValuesAsReady
            }),
            m('pre#conllu-pre', {style: {'white-space': 'pre-wrap'}}, printConllu()),
            m(POSMenuComponent),
            m(DEPRELMenuComponent),
            // An invisible component for copying text
            m('textarea', {id: 'copy-textarea', style: {position: 'fixed', left: '-1000px'}}),
            m(buttonsComponent)
        ]);
    }
};

const textareaStyle = {
    width: '100%',
    height: '80px'
}

let textFieldsComponent = {
    view: () => {
        return m(']', [
            m('div', { style: {
                display: 'grid',
                'grid-template-columns': '1fr 1fr',
                width: '500px'}},
                [
                    m('div', {style: {'grid-column': 'auto'}}, [
                        m('h4', {style: {'margin-bottom': '0'}}, 'Docid:'),
                        m('input[type=text]', {id: 'docid', value: conllu.docid, oninput: e => {e.redraw = false; conllu.docid = e.target.value;},
                        style: {width: '200px'}})
                    ]),
                    m('div', {style: {'grid-column': 'auto'}}, [
                        m('h4', {style: {'margin-bottom': '0'}}, 'Sentence id:'),
                        m('input[type=text]', {id: 'sent_id', value: conllu.sent_id, oninput: e => {e.redraw = false; conllu.sent_id = e.target.value;},
                            style: {width: '200px'}})
                    ]),
                ]),
            m('h4', {style: {'margin-bottom': '0'}}, 'Raw text:'),
            m('textarea', {name: 'raw-text', id: 'raw-text', value: conllu.text, style: textareaStyle, oninput: e => { e.redraw = false; prettifyInput(); }}),
            m('h4', {style: {'margin-bottom': '0'}}, 'Space-separated tokens:'),
            m('textarea', {name: 'tokenised-text', id: 'tokenised-text', value: conllu.tokenised === undefined ? '' :
                    conllu.tokenised.join(' '),
                style: textareaStyle}),
            m('input[type=button]', {value: 'Copy raw text', onclick: e => {
                    e.redraw = false;
                    byId('tokenised-text').value = byId('raw-text').value
                        .toLowerCase()
                        .replace(/ 7 /g, ' ocus ');
                }}),
            m('input[type=button]', {value: 'Initialise parse', onclick: getTokens}),
            m('input[type=button]', {value: 'Re-initialise parse', onclick: updateTokens})
        ])
    }
}

function markCellValuesAsReady() {
    for (let i = conllu.wordLines.length-1; i >= 0; i--) {
        for (const key in conllu.wordLines[i]) {
            if (
                conllu.wordLines[i].hasOwnProperty(key) && 
                endswith(String(conllu.wordLines[i][key]), ' ?')
            ) {
                const valueLength = conllu.wordLines[i][key].length;
                conllu.wordLines[i][key] = conllu.wordLines[i][key].slice(0, valueLength-2);
            }
        }
    }
}

function enumerateTokens(data) {
    let result = [],
        colour;  // Declaring the variable inside the loop leads to a bug.
    if (data.wordLines === undefined)
        return result;
    for (const row of data.wordLines) {
        colour = 'lightgrey';
        if (row.ID === firstTokenIdx || firstTokenIdx !== null && row.ID === secondTokenIdx)
            colour = 'red';
        else if (row.UPOS !== '_' && row.DEPREL !== '_')
            colour = 'white';
        result.push(m('div',
            {
                id: `${row.ID}-word-div`,
                class: 'token-button',
                style: {
                    'background-color': colour
                },
                onclick: e => {
                    if (firstTokenIdx === null) {
                        firstTokenIdx = row.ID;
                        m.redraw();
                    } else {
                        if (row.ID === firstTokenIdx) {
                            firstTokenIdx = null;
                            secondTokenIdx = null;
                        } else {
                            secondTokenIdx = row.ID;
                            const x = Math.min(
                                e.clientX,
                                document.documentElement.clientWidth-490);
                            byId('deprel-menu').style.left = `${x}px`;
                            byId('deprel-menu').style.top = `${e.clientY}px`;
                            byId('deprel-menu').style.display = 'grid';
                        }
                    }
                },
                ondblclick: () => {
                    firstTokenIdx = null;
                    secondTokenIdx = null;
                    data.wordLines[parseInt(row.ID)-1].HEAD = '0';
                    data.wordLines[parseInt(row.ID)-1].DEPREL = 'root';
                },
                oncontextmenu: e => {
                    e.redraw = false;
                    posTokIdx = row.ID;
                    const x = Math.min(
                        e.clientX,
                        document.documentElement.clientWidth-490);
                    byId('pos-menu').style.left = `${x}px`;
                    byId('pos-menu').style.top = `${e.clientY}px`;
                    byId('pos-menu').style.display = 'grid';
                    return false;
                }
            },
            m('div', {
                style: {
                    display: 'grid',
                    'grid-template-columns': '1fr 1fr',
                    'grid-column-gap': '3px'
                }},[
                m('div', {style: {'grid-column': '1/3', 'margin-bottom': '5px'}}, row.FORM),
                m('div.small-label', {style: {'grid-column': 'auto', 'color': 'brown'}}, row.UPOS),
                m('div.small-label', {style: {'grid-column': 'auto', 'color': 'dimgrey'}}, row.DEPREL),
                m('div.small-label', {style: {'grid-column': '1/3'}}, row.HEAD === '_' ? '_' :
                    (row.HEAD === '0' ? 'root' : `↑ ${data.wordLines[parseInt(row.HEAD)-1].FORM}`))
            ])
        ));
    }
    return result;
}

function endswith(inputString, prefix) {
	const slen = inputString.length,
		plen = prefix.length;
	return inputString.indexOf(prefix) !== -1 && inputString.slice(slen-plen) === prefix;
}

function getCellColour(value) {
    if (endswith(String(value), ' ?'))
        return '#fff0c7';
    else
        return 'white';
}

const fieldSkipList = ['FEATS', 'DEPS'],
    UDFieldsSubset = UDFields.filter(f => fieldSkipList.indexOf(f) < 0),
    fieldWidthDict = {
        'ID': 20,
        'FORM': 70,
        'LEMMA': 70,
        'UPOS': 40,
        'XPOS': 40,
        'HEAD': 20,
        'DEPREL': 40,
        'MISC': 140
    };

let conlluTableComponent = {
    view: () => {
        const wordLines = conllu.wordLines;
        if (wordLines === undefined)
            return m('table.ud-table');
        return m('table.ud-table', [
            m(
                'tr', 
                UDFieldsSubset.map(field => m(
                    'th', 
                    { style: { width: fieldWidthDict[field] + 'px' } },
                    field)
                )
            ),
            ...wordLines.map((_, i) => m('tr', UDFieldsSubset.map(
                field => m(valueGuessComponent, {i: i, field: field})
            )))
        ])
    }
}

let valueGuessComponent = {
    view: vnode => {
        const i = vnode.attrs.i,
            field = vnode.attrs.field,
            wordKey = conllu.wordLines[i].FORM.replace(/-/g, '');
        // console.log(i, field, wordKey);
        if (conllu.wordLines[i][field] !== '_' || field !== 'LEMMA' && field !== 'MISC') {
            ;
        } else if (suggestionsCache.hasOwnProperty(wordKey) && suggestionsCache[wordKey][field] !== '_') {
            if (suggestionsCache[wordKey][field] !== '_') {
                conllu.wordLines[i][field] = suggestionsCache[wordKey][field] + ' ?';
                m.redraw();
                // byId(`${i}-${field}-td`).innerText = suggestionsCache[wordKey][field] + ' ?';
            }
        } else {
            fetch(`${requestURL}/suggestions/${wordKey}`)
                .then(response => response.json())
                .then(data => {
                    suggestionsCache[wordKey] = data;
                    if (suggestionsCache[wordKey][field] !== '_') {
                        conllu.wordLines[i][field] = suggestionsCache[wordKey][field] + ' ?';
                        m.redraw();
                    }
                })
                .catch(error => {
                    alert(`Failed to download suggestions: ${error}`);
                })
        }
        return m(
            'td',
            {
                style: {
                    width: fieldWidthDict[field] + 'px',
                    padding: '3px'
                }
            },
            m('input[type=text]', {
                value: conllu.wordLines[i][field],
                disabled: ['ID', 'HEAD'].indexOf(field) >= 0,
                style: {
                    width: '100%',
                    'background-color': getCellColour(conllu.wordLines[i][field]),
                    border: '0'
                },
                oninput: e => {
                    e.redraw = false;
                    conllu.wordLines[i][field] = e.target.value;
                }
            }))
    }
}

// let conlluTableRow = {
//     oninit: vnode => {
//         const fields = vnode.attrs.fields;
//     }
// }

const POSArr = [
    'ADJ',
    'ADP',
    'ADV',
    'AUX',
    'CCONJ',
    'DET',
    'INTJ',
    'NOUN',
    'NUM',
    'PART',
    'PRON',
    'PROPN',
    'PUNCT',
    'SCONJ',
    'SYM',
    'VERB',
    'X'
];

let POSMenuComponent = {
    view: () => {
        return m('div',
            {
                id: 'pos-menu',
                style: {
                    display: 'none',
                    position: 'fixed',
                    'background-color': 'grey',
                    'padding': '5px',
                    'border-radius': '2px',
                    'grid-template-columns': '1fr 1fr 1fr 1fr'
                }},
            [
                m('div', {style: {'margin-bottom': '3px', 'grid-column': '1/5'}}, m('input[type=button]', {
                    value: '✕',
                    onclick: () => { byId('pos-menu').style.display = 'none'; }
                })),
                ...POSArr.map(pos => m('div', {style: {'grid-column': 'auto'}}, m('input[type=button].endpoint-select', {
                    value: pos,
                    onclick: () => { 
                        conllu.wordLines[posTokIdx-1].UPOS = pos;
                        byId('pos-menu').style.display = 'none';
                    }
                })))
            ]
        );
    }
}

const DEPRELArr = [
    'acl',
    'advcl',
    'advmod',
    'amod',
    'appos',
    'aux',
    'case',
    'cc',
    'ccomp',
    'clf',
    'compound',
    'conj',
    'cop',
    'csubj',
    'dep',
    'det',
    'discourse',
    'dislocated',
    'expl',
    'fixed',
    'flat',
    'goeswith',
    'iobj',
    'list',
    'mark',
    'nmod',
    'nsubj',
    'nummod',
    'obj',
    'obl',
    'orphan',
    'parataxis',
    'punct',
    'reparandum',
    'root',
    'vocative',
    'xcomp'
];

let hideDEPRELMenu = () => {
    byId('deprel-menu').style.display = 'none';
    m.redraw();
}

let DEPRELMenuComponent = {
    view: () => {
        return m('div',
            {
                id: 'deprel-menu',
                style: {
                    display: 'none',
                    position: 'fixed',
                    'background-color': 'grey',
                    'padding': '5px',
                    'border-radius': '2px',
                    'grid-template-columns': '1fr 1fr 1fr 1fr'
                }},
            [
                m('div', {style: {'grid-column': '1/5'}}, m('input[type=button]', {
                    value: '✕',
                    onclick: () => {
                        secondTokenIdx = null;
                        hideDEPRELMenu();
                    },
                    style: {'margin-bottom': '3px'}
                })),
                ...DEPRELArr.map(deprel => m('div', {style: {'grid-column': 'auto'}}, m('input[type=button].endpoint-select', {
                    value: deprel,
                    onclick: () => {
                        conllu.wordLines[firstTokenIdx-1].DEPREL = deprel;

                        // Try to guess the correct POS.
                        if (deprel === 'nmod' || deprel === 'obl')
                            conllu.wordLines[firstTokenIdx-1].UPOS = 'NOUN ?';
                        else if (deprel === 'case')
                            conllu.wordLines[firstTokenIdx-1].UPOS = 'ADP ?';
                        else if (deprel === 'cop')
                            conllu.wordLines[firstTokenIdx-1].UPOS = 'AUX ?';
                        else if (deprel === 'mark')
                            conllu.wordLines[firstTokenIdx-1].UPOS = 'SCONJ ?';
                        else if (deprel === 'cc')
                            conllu.wordLines[firstTokenIdx-1].UPOS = 'CCONJ ?';
                        else if (deprel === 'det')
                            conllu.wordLines[firstTokenIdx-1].UPOS = 'DET ?';
                        else if (deprel === 'acl' || deprel === 'advcl')
                            conllu.wordLines[firstTokenIdx-1].UPOS = 'VERB ?';
                        else if (deprel === 'nummod')
                            conllu.wordLines[firstTokenIdx-1].UPOS = 'NUM ?';
                        else if (deprel === 'conj' || deprel === 'list') {
                            // Copy the UPOS tag of the first conjunct.
                            const candidateUPOS = conllu.wordLines[secondTokenIdx-1].UPOS;
                            if (endswith(candidateUPOS, ' ?'))
                                conllu.wordLines[firstTokenIdx-1].UPOS = candidateUPOS;
                            else
                                conllu.wordLines[firstTokenIdx-1].UPOS = `${candidateUPOS} ?`;
                        }

                        conllu.wordLines[firstTokenIdx-1].HEAD = secondTokenIdx;
                        firstTokenIdx = null;
                        secondTokenIdx = null;
                        hideDEPRELMenu();
                    }
                })))
            ]
        );
    }
}

const hOffset = 5;

let UDVisualisationComponent = {
    onupdate: () => {
        let nodes = new vis.DataSet(),
            edges = new vis.DataSet(),
            container = byId('canvas'),
            data = {
                nodes: nodes,
                edges: edges
            },
            options = {
                physics:true,
                edges: {
                    smooth: {
                        type: 'curvedCCW',
                        forceDirection: 'vertical'
                    }
                },
                nodes: {
                    mass: 10,
                    fixed: true,
                    font: {
                        size: 16,
                        face: 'monospace'
                    },
                    margin: 10,
                    // color: 'lightblue'
                },
            },
            network = new vis.Network(container, data, options);

        // Add nodes
        let leftOffset = -1000;
        for (const line of conllu.wordLines) {
            let id = line.ID,
                label = line.FORM;
            nodes.add({
                id: id,
                label: label,
                x: leftOffset,
                y: 0,
                color: line.DEPREL === 'root' ? 'green' : 'lightblue'
            });
            leftOffset = leftOffset + hOffset * line.FORM.length + 70;
        }

        // Add edges
        for (const line of conllu.wordLines) {
            let id = line.ID,
                label = line.DEPREL;
            if (label === 'root' || label === 'punct')
                continue;
            edges.add({
                id: `${id}->${line.HEAD}`,
                arrows: 'from',
                from: id,
                to: line.HEAD,
                label: label
            });
        }

        network.fit();
    },
    view: () => m('div', {
        id: 'canvas',
        style: {
            width: '100%',
            height: '400px'
        }
    })
}

let buttonsComponent = {
    view: () => m('div', [
        m('input[type=button]', {value: 'Clear', onclick: () => { conllu = {} }}),
        m('input[type=button]', {value: 'Update record', disabled: currentRecordId === 0 || unverifiedValues(), onclick: e => {e.redraw = false; updateRecord();}}),
        m('input[type=button]', {value: 'Submit new record', disabled: unverifiedValues(), onclick: e => {e.redraw = false; newRecord();}})
    ])
}