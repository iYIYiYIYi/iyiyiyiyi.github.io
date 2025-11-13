var LR0 = function (c) {
    this.splitor = '->';
    this.or = '|';
    this.newOne = '`';
    this.epsilon = 'ε';
    this.state = '·';
    this.table = {};
    this.start = ''//初始状态
    let s = c.trim().split('\n');
    this.end = '$';
    this.finalSymbol = [];
    this.broaden_grammar = [];

    this.grammar = {};
    s.forEach((value,index) => {
        let obj = this._splitGrammar(value);
        this.grammar[obj.name] = obj;
        if (index === 0) {
            this.start = obj.name+this.newOne;
            this._buildGrammar(this.start,obj.name);
        }
    });
    this._findFinalSymbols();
    this._splitStates();
    this._createAutoMachine();
}

LR0.prototype._findFinalSymbols = function () {
    let set = new Set();
    for (const grammarKey in this.grammar) {
        for (const item of this.grammar[grammarKey].items) {
            for (const itemElement of item) {
                if (!this.grammar[itemElement]&&itemElement !== this.epsilon)
                    set.add(itemElement);
            }
        }
    }

    this.finalSymbol = Array.from(set);
    this.finalSymbol.push(this.end);
}

LR0.prototype._buildGrammar = function(name,...content) {
    let finalContent = '';
    content.forEach((value) => {
        finalContent += value+' ';
    });
    let obj = {
        "name":name,
        "content":finalContent,
        "items":this._changeGrammar(finalContent),
    };
    this.grammar[obj.name] = obj;
}

/**
 * 生成语法数组，只接受无箭头的语法部分
 * @param content
 * @returns {[]}
 * @private
 */
LR0.prototype._changeGrammar = function (content) {
    let items = [];
    let itemsArr = content.split(this.or);
    itemsArr.forEach((value, index) => {
        let tokens = value.split(" ");
        tokens = this._cleanBlank(tokens);
        items.push(tokens);
    });
    return items;
}

/**
 * 解析语法
 * @param grammar
 * @returns {{name, items: [], content}}
 * @private
 */
LR0.prototype._splitGrammar = function (grammar) {
    let nameAndContent = grammar.split(this.splitor);
    let name = nameAndContent[0].replaceAll(' ','');
    let content = nameAndContent[1];
    return {
        "name":name,
        "content":content,
        "items":this._changeGrammar(content),
    };
}

/**
 * 清理数组
 * @param arr
 * @returns {any}
 * @private
 */
LR0.prototype._cleanBlank = function (arr) {
    let s = JSON.stringify(arr).replaceAll('\"\",',"");
    s = s.replaceAll(',\"\"',"");
    return JSON.parse(s)
}

/**
 * 增广文法
 * @private
 */
LR0.prototype._splitStates = function () {
    for (const grammarKey in this.grammar) {
        this.grammar[grammarKey].items.forEach((item, index) => {
            let s = grammarKey + this.splitor;
            for (let i = 0;i <= item.length; i ++) {
                let s2 = item.slice(i);
                let content = s ;
                item.forEach((value,index) => {
                    if (index === i) {
                        content += ' '+this.state;
                    }
                    content +=' ' + value;
                });
                if (i === item.length) {
                    content += ' ' + this.state;
                }
                this.broaden_grammar.push({
                   "name":grammarKey,
                   "content":content,
                   "next":s2[0],
                   "index": index,
                    "items":item,
                    "state_index":i,
                });
            }
        });
    }
}

LR0.prototype._createAutoMachine = function () {
    this.allStates = [];
    let addState = (start_state)=>{
        let state = [start_state];
        let next = start_state.next;
        let nexts = new Set();
        for (const ele of this.broaden_grammar) {
            if (ele.name === start_state.name && ele.state_index - start_state.state_index === 1) {
                nexts.add(ele);
            }
        }
        if (this.grammar[next]) {
            //终态
            let flag = [next];
            while (flag.length>0) {
                let local_next = flag.shift();
                for (const broadenGrammarElement of this.broaden_grammar) {
                    if (broadenGrammarElement.name === local_next && broadenGrammarElement.state_index === 0) {
                        if (state.indexOf(broadenGrammarElement) !== -1) {
                            continue;
                        }
                        state.push(broadenGrammarElement);
                        flag.push(broadenGrammarElement.items[0]);
                        for (const ele of this.broaden_grammar) {
                            if (ele.name === broadenGrammarElement.name && ele.state_index - broadenGrammarElement.state_index === 1) {
                                if (nexts.has(ele))
                                    continue;

                                nexts.add(ele);
                            }
                        }
                    }
                }
            }
        }
        let obj = {
            "state":state,
        };
        for (let next1 of nexts) {
            if (next1 === start_state.name)
                continue
            else
                addState(next1);
        }
        this.allStates.push(obj);

    };
    let start_state = undefined;
    this.broaden_grammar.forEach((value) => {
        if (value.name === this.start&&value.state_index === 0)
            start_state = value
    })
    addState(start_state);

    for (const allStateKey in this.allStates) {
        let arr = this.allStates[allStateKey].state;
        for (const arrKey in arr) {
            let next = arr[arrKey].next;
            this.allStates.forEach((value, index1) => {
                if (value.state[0].items[value.state[0].state_index] === next && value.state[0].state_index - arr[arrKey].state_index === 1) {
                    this.allStates[allStateKey][next] = index1;
                }
            });
        }
    }
}

LR0.prototype.parse = function (s) {

}