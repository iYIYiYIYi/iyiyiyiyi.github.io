let viz = new Viz(),tmp_svg;
window.onload = ()=>{
    $nfaBtn = $('#nfa');
    $dfaBtn = $('#dfa');
    $minidfaBtn = $('#minidfa');
    $graph = $('#graph');

    $dfaBtn.click((e)=>{
        let dot = dfaToDotScript(dfa);

        viz.renderSVGElement(dot)
            .then(function(v) {
                $(v).attr('width','98vw');
                tmp_svg = v;
                $graph.html(v);
            });
        $dfaBtn.attr('class','selected');
        $nfaBtn.attr('class','');
        $minidfaBtn.attr('class','');
    });

    $nfaBtn.click((e)=>{
        let dot = nfaToDotScript(nfa);
        viz.renderSVGElement(dot)
            .then(function(v) {
                $(v).attr('width','98vw');
                tmp_svg = v;
                $graph.html(v);
            });
        $nfaBtn.attr('class','selected');
        $dfaBtn.attr('class','');
        $minidfaBtn.attr('class','');
    });

    $minidfaBtn.click((e)=>{
        mini_dfa = DFA.minifyDFA(dfa,charset);
        console.log(mini_dfa);

        let dot = dfaToDotScript(mini_dfa);
        viz.renderSVGElement(dot)
            .then(function(v) {
                $(v).attr('width','98vw');
                tmp_svg = v;
                $graph.html(v);
            });
        $nfaBtn.attr('class','');
        $dfaBtn.attr('class','');
        $minidfaBtn.attr('class','selected');
    })
}



function saveImage() {
    let item = $('#graph svg');
    var image = new Image();
    image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(item))); //给图片对象写入base64编码的svg流

    var canvas = document.createElement('canvas');  //准备空画布
    canvas.width = item.width();
    canvas.height = item.height();

    var context = canvas.getContext('2d');  //取得画布的2d绘图上下文
    context.drawImage(image, 0, 0);

    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');  //将画布内的信息导出为png图片数据
    a.download = "dots";  //设定下载名称
    a.click(); //点击触发下载
}

//按照优先级排列
const character = ['(',')','|','·','*'];

/**
 * 获取所有状态
 * @param v
 * @returns {string}
 */
var parseCharset = function(v) {
    // v = v.replace(/[^a-zA-Z0-9]+/g, '');
    for (const c of character) {
        v.replaceAll(c,'')
    }
    v = v.split('').sort();
    v = Array.from(new Set(v));
    v = v.join('');

    return v;
};

var nfaToDotScript = function(nfa) {
    var initialState = nfa.initialState;
    var finalState = nfa.finalState;

    var result = `
digraph nondeterministic_finite_automaton {
    rankdir = LR;
    node [shape = circle]; ${initialState};
    node [shape = doublecircle]; ${finalState};
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
};

var dfaToDotScript = function(dfa) {
    var initialState = dfa.initialState;
    var finalStates = Array.from(dfa.finalStates).join('; ');

    var result = `
        digraph deterministic_finite_automaton {
            rankdir = LR;
        `;
    if (!dfa.finalStates.has(initialState)) {
        result += `    node [shape = circle]; ${initialState};\n`;
    }
    result += `     node [shape = doublecircle]; ${finalStates};
                    node [shape = plaintext];
                    "" -> ${initialState} [label = "start"];
                    node [shape = circle];
                `;

    for (var p in dfa._transitions) {
        for (var accept in dfa._transitions[p]) {
            var q = dfa._transitions[p][accept];
            result += `    ${p} -> ${q} [label="${accept}"]\n`;
        }
    }
    result += '}';

    return result;
};
let charset,nfa,dfa,mini_dfa;

function getRe() {
    const re = document.getElementById('re').value;

    if (re.trim().length === 0) {
        return
    }

    //添加符号
    let full_re = "";
    for (let i=0;i<re.length;++i) {
        full_re += re[i];
        if (i < re.length-1) {
            let l = character.indexOf(re[i])===1?-1:character.indexOf(re[i])
            let r = character.indexOf(re[i+1])===0?-1:character.indexOf(re[i+1])
            //两种都是字母
            if (l*r > 0 && l+r <0) {
                full_re += character[3];
            }
            //*( 和 a(
            if (r === 0&&l !== 2) {
                full_re += character[3];
            }
            //*a
            if (r === -1&&l === 4){
                full_re += character[3];
            }
        }
    }
    console.log('full regex:',full_re);

    const polished = getReversePolishNotation(full_re);
    console.log('polished: ',polished);
    document.getElementById("polished").innerText = '逆波兰式:'+polished
    charset = parseCharset(re);
    console.log('charset: ',charset);

    nfa = NFA.fromPolishedRegex(charset, polished);
    console.log(nfa);
    $nfaBtn.click();

    dfa = DFA.fromNFA(nfa,charset);
    console.log(dfa);

}

/**
 * 调度场算法生成逆波兰式
 * @param re 被填充过的中缀表达式
 * @returns {string} 生成的后缀表达式
 */
function getReversePolishNotation(re) {
    let p = ''
    let stack = []
    for (let i=0;i<re.length;i++) {
        let priority = character.indexOf(re[i])
        switch (priority) {
            //字母
            case -1:{
                p += re[i];
                break;
            }
            //左括号 (
            case 0:{
                stack.push(re[i])
                break;
            }
            //右括号 )
            case 1:{
                let peek = stack.pop()
                while (peek !== character[0]) {
                    p += peek;
                    peek = stack.pop()
                }
                break;
            }
            //判断单目运算符 *
            case 4:{
                p+=re[i]
                break
            }
            //其它运算
            default:{
                let peek = stack[stack.length-1]
                let peek_priority = character.indexOf(peek)

                if (priority === 0) {
                    //左括号
                    stack.push(re[i])
                } else if (peek_priority >= priority) {
                    while (peek_priority >= priority) {
                        p += peek;
                        stack.pop()
                        peek = stack[stack.length-1]
                        peek_priority = character.indexOf(peek);
                    }
                    stack.push(re[i])
                } else if (peek_priority < priority) {
                    stack.push(re[i]);
                }
                break;
            }

        }
    }

    //将剩余符号出栈
    while (stack.length > 0) {
        p += stack.pop()
    }

    return p
}




