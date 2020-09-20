let firstTokenSelected = false,
    tokenIdx, secondTokenIdx;

let parseComponent = {
    view: () => {
        return m(']', [
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
                onclick: () => {}
            }),
            m('pre#conllu-pre', {style: {'white-space': 'pre-wrap'}}, printConllu()),
            m(POSMenuComponent),
            m(DEPRELMenuComponent),
            // An invisible component for copying text
            m('textarea', {id: 'copy-textarea', style: {position: 'fixed', left: '-1000px'}})
        ]);
    }
};

function enumerateTokens(data) {
    let result = [];
    for (const row of data.wordLines) {
        let colour = 'white';
        if (firstTokenSelected && row.ID === tokenIdx)
            colour = 'red';
        else if (row.UPOS === '_' || (row.UPOS !== 'PUNCT' && row.DEPREL === '_'))
            colour = 'lightgrey';
        result.push(m('div',
            {
                id: `${row.ID}-word-div`,
                class: 'token-button',
                style: {
                    'background-color': colour
                },
                onclick: e => {
                    e.redraw = false;
                    if (!firstTokenSelected) {
                        tokenIdx = row.ID;
                        firstTokenSelected = true;
                        m.redraw();
                    } else {
                        if (row.ID === tokenIdx) {
                            firstTokenSelected = false;
                            m.redraw();
                        } else {
                            secondTokenIdx = row.ID;
                            byId(`${row.ID}-word-div`).style.backgroundColor = 'red';
                            byId('deprel-menu').style.left = `${e.clientX}px`;
                            byId('deprel-menu').style.top = `${e.clientY}px`;
                            byId('deprel-menu').style.display = 'grid';
                        }
                    }
                },
                ondblclick: () => {
                    firstTokenSelected = false;
                    data.wordLines[parseInt(row.ID)-1].HEAD = '0';
                    data.wordLines[parseInt(row.ID)-1].DEPREL = 'root';
                },
                oncontextmenu: e => {
                    e.redraw = false;
                    tokenIdx = row.ID;
                    byId('pos-menu').style.left = `${e.clientX}px`;
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

let conlluTableComponent = {
    view: () => {
        const wordLines = conllu.wordLines;
        return m('table.ud-table', [
            m('tr', UDFields.map(field => m('th', field))),
            ...wordLines.map((wordLine, i) => m('tr', UDFields.map(
                field => m('td', m('input[type=text]', {
                    value: conllu.wordLines[i][field],
                    disabled: ['ID'].indexOf(field) >= 0,
                    style: {width: '80px'},
                    oninput: e => {
                        e.redraw = false;
                        conllu.wordLines[i][field] = e.target.value;
                    }
                }))
            )))
        ])
    }
}

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

let hidePOSMenu = () => {byId('pos-menu').style.display = 'none'}

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
                    onclick: hidePOSMenu
                })),
                ...POSArr.map(pos => m('div', {style: {'grid-column': 'auto'}}, m('input[type=button].endpoint-select', {
                    value: pos,
                    onclick: () => { conllu.wordLines[tokenIdx-1].UPOS = pos; hidePOSMenu(); }
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

let hideDEPRELMenu = () => {byId('deprel-menu').style.display = 'none'}

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
                        byId(`${conllu.wordLines[secondTokenIdx-1].ID}-word-div`).style.backgroundColor = 'white';
                        hideDEPRELMenu();
                    },
                    style: {'margin-bottom': '3px'}
                })),
                ...DEPRELArr.map(deprel => m('div', {style: {'grid-column': 'auto'}}, m('input[type=button].endpoint-select', {
                    value: deprel,
                    onclick: () => {
                        conllu.wordLines[tokenIdx-1].DEPREL = deprel;
                        conllu.wordLines[tokenIdx-1].HEAD = secondTokenIdx;
                        byId(`${conllu.wordLines[secondTokenIdx-1].ID}-word-div`).style.backgroundColor = 'white';
                        firstTokenSelected = false;
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
                    color: 'lightblue'
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
                y: 0
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