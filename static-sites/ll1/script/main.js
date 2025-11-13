window.onload = ()=>{
    G = document.getElementById("text");
    graph = document.getElementById('graph');
    btn1 = document.getElementById('table');
    btn2 = document.getElementById('stack');
}

function getG() {
    let s = G.value;
    console.log(s);

    ll1 = new LL1(s);
    if(ll1.parse()) {
        console.log(ll1.grammar);
        drawTable();
    } else {
        alert("输入文法为非LL(1)文法");
        graph.innerText = "<h2>输入文法为非LL(1)文法，无法解析</h2>";
    }

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

function drawTable() {
    if (btn1.className === 'std-btn-active') {
        //隐藏界面
        toggleGraph(false);
        changeColor();
    } else {
        toggleGraph(true);
        changeColor('table');
        if (!ll1.isLL1) {
            graph.innerHTML = '<h2>输入文法为非LL(1)文法，无法解析</h2>';
            return;
        }

        //绘制表格
        let table_head = '<table border="1">';
        let table_footer = '</table>';
        let table = '<tr><th></th>';
        for (const finalSymbolElement of ll1.finalSymbol) {
            table += '<th>'+finalSymbolElement+'</th>';
        }
        table += '</tr>';
        for (const tableKey in ll1.table) {
            let tr = '';
            tr += '<tr><th>'+tableKey+'</th>';
            for (const finalSymbolElement of ll1.finalSymbol) {
                if (ll1.table[tableKey][finalSymbolElement]) {
                    tr += '<td>'+ll1.table[tableKey][finalSymbolElement]['name']+'</td>';
                } else {
                    tr += '<td>'+' '+'</td>';
                }
            }
            tr += '</tr>';
            table += tr;
        }
        let table1 = '<tr><th></th><th>First</th><th>Follow</th>';
        for (const grammarKey in ll1.grammar) {
            let first_s = ' ';
            for (const firstElement of ll1.grammar[grammarKey].first) {
                first_s += firstElement+' ';
            }
            let follow_s = ' ';
            for (const followElement of ll1.grammar[grammarKey].follow) {
                follow_s += followElement+' ';
            }
            table1 += '<tr><th>'+grammarKey+'</th>'+'<td>'+first_s+'</td>'+'<td>'+follow_s+'</td>';
        }
        let ll1Grammar = '<p class="grammar-p">'+'输入文法(消除左递归并提取左因子)：<br>'+ll1.printGrammar()+'</p>';

        graph.innerHTML = ll1Grammar + table_head +table+table_footer;

        graph.innerHTML += table_head +table1+table_footer;
    }
}

function drawStack() {
    if (btn2.className === 'std-btn-active') {
        //隐藏界面
        toggleGraph(false);
        changeColor()
    } else {
        toggleGraph(true);
        changeColor('stack');
        if (!ll1.isLL1) {
            graph.innerHTML = '<h2>输入文法为非LL(1)文法，无法解析</h2>';
            return;
        }
        //绘制表格
        let s = document.getElementById('grammar').value;
        if (s&&s.length > 0) {
            let table = ll1.judgeGrammar(s);
            //绘制表格
            let table_head = '<table border="1">';
            let table_footer = '</table>';
            let tables = '<tr><th>序号</th><th>分析栈</th><th>输入栈</th><th>动作</th></tr>';

            for (const tableKey in table) {
                let obj = table[tableKey];
                let index = Number(tableKey)+1;

                tables += '<tr><td>'+index+'</td><td>'+obj.analyse_stack+'</td><td>'+obj.input+'</td><td>'+obj.output+'</td></tr>';
            }
            let input = '<p class="grammar-p">'+'输入串：'+s+'</p>';
            console.log(table);
            graph.innerHTML = input + table_head+tables+table_footer;
        } else {
            graph.innerHTML = '<h2>请输入语句</h2>';
        }
    }

}