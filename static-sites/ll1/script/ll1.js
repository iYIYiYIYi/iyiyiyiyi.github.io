
var LL1 = function (c) {
    this.splitor = '->';
    this.or = '|';
    this.newOne = '`';
    this.epsilon = 'ε';
    this.table = {};
    this.select = {};
    this.start = ''//初始状态
    let s = c.trim().split('\n');
    this.end = '$';
    this.finalSymbol = [];
    this.isLL1 = true;

    this.grammar = {};
    s.forEach((value,index) => {
        let obj = this._splitGrammar(value);
        this.grammar[obj.name] = obj;
        if (index === 0)
            this.start = obj.name;
    });
    this._findFinalSymbols();
}

LL1.prototype._findFinalSymbols = function () {
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

LL1.prototype._buildGrammar = function(name,...content) {
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
LL1.prototype._changeGrammar = function (content) {
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
LL1.prototype._splitGrammar = function (grammar) {
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
LL1.prototype._cleanBlank = function (arr) {
    let s = JSON.stringify(arr).replaceAll('\"\",',"");
    s = s.replaceAll(',\"\"',"");
    return JSON.parse(s)
}

/**
 * 消除左递归
 * @private
 */
LL1.prototype._parser = function () {
    let judgeContainsLeftRecursion = true;
    while (judgeContainsLeftRecursion) {
        let counter = 0;
        for (const grammarKey in this.grammar) {
            let g = this.grammar[grammarKey].name;
            let split_index = this.grammar[grammarKey].content.indexOf(this.or);
            let split = [this.grammar[grammarKey].content.substring(0,split_index-1),this.grammar[grammarKey].content.substring(split_index+1)];
            let tokens = [],beta = '';
            let newname = g+this.newOne;
            for (const item of this.grammar[grammarKey].items) {
                if (item[0] === g) {
                    tokens = Array.from(item);
                } else {
                    for (const itemElement of item) {
                        beta += ' ' + itemElement + ' ' + newname;
                    }
                    if (item !== this.grammar[grammarKey].items[this.grammar[grammarKey].items.length-1])
                        beta += this.or;
                }
            }

            if (g === tokens[0]) {
                 let alpha = ' ';
                 tokens.slice(1).forEach(value => alpha += value+' ');
                 this._buildGrammar(g,beta);
                 this._buildGrammar(newname,alpha,newname,this.or,this.epsilon);
                 counter ++ ;
            }
        }

        if (counter === 0) {
            judgeContainsLeftRecursion = false;
        }
    }
}

LL1.prototype._calcSameFactor = function (fac1,fac2) {
    let length = Math.min(fac1.length,fac2.length);
    let counter = 0;
    for (let i = 0;i < length;i ++) {
        if (fac1[i] === fac2[i])
            counter ++;
        else
            return counter;
    }

    return counter;
}

/**
 * 提取左因子
 * @private
 */
LL1.prototype._getLeftPublicFactor = function() {
    for (let grammarKey in this.grammar) {
        let obj = this.grammar[grammarKey];

        let itemFactorMap = {};
        let items = obj["items"];
        for (let item of items) {
            for (let item1 of items) {
                if (item === item1) continue;

                let index = this._calcSameFactor(item,item1);
                //记录左因子
                if (index > 0) {
                    let leftFactor = item.slice(0,index);
                    let rightFactor = item.slice(index);
                    if (rightFactor === '')
                        rightFactor = this.epsilon;
                    if (itemFactorMap[leftFactor]) {
                        itemFactorMap[leftFactor].push(rightFactor);
                    } else {
                        itemFactorMap[leftFactor] = [rightFactor];
                    }
                }
            }
        }

        let newG = ' ',newName = this.newOne;
        let rightFactorSet = new Set();
        for (let itemFactorMapKey in itemFactorMap) {
            let arr = itemFactorMap[itemFactorMapKey];
            let s = "";
            arr.forEach((v,i)=>{
                let ss = ' ';
                v.forEach(value=>{
                   ss += value+' ';
                });
                if (i === 0) {
                    s = ss;
                } else if (ss.length > 0) {
                    s += ' |'+ss;
                }
            });

            let gName = obj.name+newName;
            if (!rightFactorSet.has(s)) {
                this._buildGrammar(gName,s);
                rightFactorSet.add(s);
            } else {
                newName += this.newOne;
            }

            newG += itemFactorMapKey+' '+gName+' |';
        }
        newG = newG.substring(0,newG.length-1);
        if (newG !== '') {
            this.grammar[grammarKey] = {
                "name":obj.name,
                "content":newG,
                "items":this._changeGrammar(newG),
            };
        }
    }
}

LL1.prototype._getFirst = function () {
    let findFirst = (items,first)=>{
        for (let item of items) {
            if (this.grammar[item[0]]) {
                if (this._judgeEpsilon(this.grammar[item[0]])) {
                    if (!this.grammar[item[1]]&&item[1] !== this.epsilon)
                        first.add(item[1]);
                    else
                        findFirst(this.grammar[item[1]].items,first);
                }
                //第一个是非终结符
                findFirst(this.grammar[item[0]].items,first);
            }
            else if (item[0] !== this.epsilon) {
                //第一个是终结符
                first.add(item[0]);
            }
        }
    };

    for (let grammarKey in this.grammar) {
        let items = this.grammar[grammarKey].items;
        let first = new Set();
        findFirst(items,first);
        if (this._judgeEpsilon(this.grammar[grammarKey]))
            first.add(this.epsilon);
        this.grammar[grammarKey].first = Array.from(first);
    }
}

LL1.prototype._getFollow = function () {
    //初始化集合
    for (let grammarKey in this.grammar) {
        this.grammar[grammarKey].follow = new Set();
    }

    let backPropagation = (items,element,name) =>{

        for (let item of items) {
            let end = item[item.length-1];

            if (name === end) {
                continue;
            }
            if (this.grammar[end]) {
                this.grammar[end].follow.add(element);
                backPropagation(this.grammar[end].items,element,end);
            }
        }
    }

    let findFollow = (items,name)=>{
        for (let itemArr of items) {
            for (let key in itemArr) {
                let itemKey = Number(key);
                //是非终结符
                if (this.grammar[itemArr[itemKey]]) {
                    //后一位是终结符
                    let thisFollow = this.grammar[itemArr[itemKey]].follow;
                    if (itemArr[itemKey+1]&&!this.grammar[itemArr[itemKey+1]]) {
                        thisFollow.add(itemArr[itemKey+1]);
                        backPropagation(this.grammar[itemArr[itemKey]].items,itemArr[itemKey+1],this.grammar[itemArr[itemKey]].name);
                    }
                    //后一位是非终结符
                    else if (itemArr[itemKey+1]) {
                        let first = this.grammar[itemArr[itemKey+1]].first;
                        for (const firstElement of first) {
                            if (firstElement !== this.epsilon) {
                                thisFollow.add(firstElement);
                                backPropagation(this.grammar[itemArr[itemKey]].items,firstElement,this.grammar[itemArr[itemKey]].name);
                            }
                        }
                        if (this._judgeEpsilon(this.grammar[itemArr[itemKey+1]])) {
                            let from = this.grammar[itemArr[itemKey+1]];
                            let to = this.grammar[itemArr[itemKey]];

                            for (const followElement of from.follow) {
                                to.follow.add(followElement);
                                backPropagation(to.items,followElement,to.name);
                            }
                        }
                    }

                    if (itemKey === itemArr.length-1)
                        this.grammar[itemArr[itemKey]].follow.add(this.end);
                }
            }
        }
    }

    let oldOne = '',newOne = '';
    do {
        oldOne = newOne;
        newOne = '';
        for (let grammarKey in this.grammar) {
            let items = this.grammar[grammarKey].items;
            if (grammarKey === this.start) {
                this.grammar[grammarKey].follow.add(this.end);
            }
            findFollow(items,this.grammar[grammarKey].name);
            newOne += JSON.stringify(this.grammar[grammarKey].follow);
        }

    } while (oldOne !== newOne)

    //将集合转换为数组表示
    for (let grammarKey in this.grammar) {
        let arr = Array.from(this.grammar[grammarKey].follow);
        this.grammar[grammarKey].follow = arr;
    }
}

/**
 * 检测是否存在epsilon状态
 * @param obj
 * @returns {boolean}
 * @private
 */
LL1.prototype._judgeEpsilon = function (obj) {
    let items = obj.items;
    for (const item of items) {
        if (item.indexOf(this.epsilon) !== -1) {
            return true;
        }
    }
    return false;
}

/**
 * 计算串X1X2 …Xn的FIRST 集合
 * @param elements
 * @private
 */
LL1.prototype._findMultipleFirst = function (elements) {
    let first = new Set(),flag = 0,counter = 0;
    for (let element of elements) {
        if (flag !== counter) break;

        if (this.grammar[element]) {
            for (let firstElement of this.grammar[element].first) {
                if (firstElement !== this.epsilon)
                    first.add(firstElement);
            }
            if (this._judgeEpsilon(this.grammar[element]))
                    flag++;
        } else {
            first.add(element);
        }

        counter++;
    }

    if (counter === flag)
        first.add(this.epsilon);

    return first;
}

LL1.prototype._findSelect = function () {
    for (const grammarKey in this.grammar) {
        let items = this.grammar[grammarKey].items;
        let select = [];
        let index = 0;
        for (let item of items) {
            //分层
           let select2 = this._findMultipleFirst(item);
           if (select2.has(this.epsilon)) {
               select2.delete(this.epsilon);
               for (let followElement of this.grammar[grammarKey].follow) {
                   select2.add(followElement);
               }
           }

            let select1 = {
                "name":this.grammar[grammarKey].name+this.splitor+JSON.stringify(item).replaceAll("\"",'').replace('[',' ').replace(']','').replaceAll(',',' '),
                "select":Array.from(select2),
                "index":index,
            };
            select.push(select1);
            index ++;
        }
        this.select[grammarKey] = select;
    }

}

LL1.prototype._genTable = function () {
    for (let selectKey in this.select) {
        let piece = {};
        for (const obj of this.select[selectKey]) {
            for (const selectPiece of obj["select"]) {
                piece[selectPiece] = {
                    'name':obj['name'],
                    'index':obj['index'],
                };
            }
        }
        this.table[selectKey] = piece;
    }
}

LL1.prototype.parse = function () {
    this._parser();
    this._getLeftPublicFactor();

    this._getFirst();
    this._getFollow();
    this._findSelect();
    s = this.printGrammar();
    console.log(s);
    if (this._judgeGrammar()) {
        this._genTable();
        console.log(this.table);
        return true;
    }
    return false;
}

LL1.prototype.printGrammar = function (content) {
    if (content) {
        return value.name+this.splitor+value.content;
    } else {
        let s = ''
        let counter = 1;
        for (let grammarKey in this.grammar) {
            let value = this.grammar[grammarKey];
            s += counter + '. ' + value.name+this.splitor+value.content+'<br>';
            counter++;
        }
        return s;
    }
}

/**
 * 判断是否为LL1 文法
 * @returns {boolean}
 * @private
 */
LL1.prototype._judgeGrammar = function () {
    for (const selectKey in this.select) {
        if (this.select[selectKey].length <= 1) continue;
        let set = new Set();
        for (const finalSymbolObj of this.select[selectKey]) {
            for (const selectElement of finalSymbolObj.select) {
                if (set.has(selectElement)) {
                    this.isLL1 = false;
                    return false;
                }
                set.add(selectElement);
            }
        }

    }
    
    return true;
}

/**
 * 判断语句是否符合文法,并构建分析栈
 * @param s
 */
LL1.prototype.judgeGrammar = function (s) {
    let items = this._cleanBlank(s.split(' '));
    let analyse_stack = [this.start];
    let obj = {
        'analyse_stack':Array.from(analyse_stack).reverse().toString().replaceAll("\"",'').replaceAll(',',' ')+this.end,
        'input':items.toString().replaceAll("\"",'').replaceAll(',',' ')+this.end,
        'output':'',
    }
    let record_table = [obj];
    while (analyse_stack.length > 0) {
        let item = items[0]||this.end;
        let flag = true;
        while (flag) {
            let output = '';
            let curState = analyse_stack.pop()||this.end;
            if (this.table[curState]&&this.table[curState][item]) {
                let index = this.table[curState][item]['index'];
                output = this.table[curState][item]['name'];
                let arr = this.grammar[curState].items[index];
                for (let i = arr.length-1; i >= 0 ; i--) {
                    if (arr[i] !== this.epsilon)
                        analyse_stack.push(arr[i]);
                }
            } else if (curState === item) {
                items.shift();
                flag = false;
                if (curState === this.end)
                    break;
            } else {
                let obj = {
                    'analyse_stack':Array.from(analyse_stack).reverse().toString().replaceAll("\"",'').replaceAll(',',' ')+this.end,
                    'input':items.toString().replaceAll("\"",'').replaceAll(',',' ')+this.end,
                    'output':'error',
                }
                record_table.push(obj);
                return record_table;
            }
            let obj = {
                'analyse_stack':Array.from(analyse_stack).reverse().toString().replaceAll("\"",'').replaceAll(',',' ')+this.end,
                'input':items.toString().replaceAll("\"",'').replaceAll(',',' ')+this.end,
                'output':output,
            }
            record_table.push(obj);
        }
    }

    return record_table;
}
