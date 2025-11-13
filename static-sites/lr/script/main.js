window.onload = ()=>{
    G = document.getElementById("text");
    graph = document.getElementById('graph');
    btn1 = document.getElementById('table');
    btn2 = document.getElementById('stack');
}

function getG() {
    let s = G.value;
    console.log(s);

    lr0 = new LR0(s);
}

function changeColor(btn_name) {

    let btns = [btn1,btn2];
    for (let btn of btns) {
        if (btn_name === btn.id) {
            btn.className = 'std-btn-active';
        } else {
            btn.className = 'std-btn';
        }
    }
}

function toggleGraph(state) {
    let graphStyle = 'block';

    if (state !== undefined) {
        if (state) {
            graph.style.display = graphStyle;
        } else {
            graph.style.display = 'none';
        }
    } else {
        if (graph.style.display === 'none') {
            graph.style.display = graphStyle;
        } else {
            graph.style.display = 'none';
        }
    }

}

function drawMachine() {

    var result = `
    digraph nondeterministic_finite_automaton {
        rankdir = LR;
        node [shape = rect]; ${initialState};
        node [shape = plaintext];
        "" -> ${initialState} [label = "start"];
        node [shape = circle];
    `;

    for (var p in nfa._transitions) {
        var node = nfa._transitions[p];
        for (var accept in node) {
            for (var i in node[accept]) {
                var q = node[accept][i];
                result += `    ${p} -> ${q} [label="${accept}"]\n`;
            }
        }
    }
    result += '}';

    return result;
}
