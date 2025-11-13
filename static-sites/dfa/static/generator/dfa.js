
var numCmp = function(x, y) {
    return x - y;
};

//DFA状态结点，将数组转为JSON字符后作为键存储
var Conceal = {};
Conceal._list = {};
Conceal._assoc = {};
Conceal._idx = 0;
Conceal.stringify = function(v) {
    var key = JSON.stringify(v);
    if (key in Conceal._assoc) {
        return Conceal._assoc[key];
    }

    Conceal._assoc[key] = Conceal._idx;
    Conceal._list[Conceal._idx] = v;

    return this._idx++;
};
Conceal.parse = function(id) {
    return Conceal._list[id];
};

var DFA = function(charset, initialState) {
    this.initialState = initialState;
    this.finalStates = new Set();
    this.charset = charset || '';
    this._transitions = {};
    this._state = 0;
};

DFA.fromNFA = function(nfa, charset) {
    var dfa = new DFA(charset);
    dfa._state = nfa._state;
    dfa._fromNFA(nfa);

    return dfa;
}

DFA.prototype.newState = function() {
    this._state++;
    this._transitions[this._state] = {};

    return this._state;
};

DFA.prototype.addTransition = function(from, to, accept) {
    if (!(from in this._transitions)) {
        this._transitions[from] = {};
    }

    this._transitions[from][accept] = to;
};

DFA.prototype.isFinalState = function(state) {
    return this.finalStates.has(state);
}

DFA.prototype._fromNFA = function(nfa) {
    //求闭包
    var epsClosure = function(state, states) {
        var states = new Set([state]);
        var Q = [state];
        while (Q.length > 0) {
            var p = Q.shift();
            if (!(p in nfa._transitions) ||
                !(NFA.EPS in nfa._transitions[p])
            ) {
                continue;
            }

            for (var q of nfa._transitions[p][NFA.EPS]) {
                if (!states.has(q)) {
                    states.add(q);
                    Q.push(q);
                }
            }
        }

        states = Array.from(states);
        console.log('closure: ',states)
        return states;
    };

    //保证DFA生成的字符状态与NFA一致(方便遍历)
    this.charset = nfa.charset;

    var Q = [];
    var marked = {};

    this.initialState = Conceal.stringify(epsClosure(nfa.initialState));
    // 将初始状态存入
    Q.push(this.initialState);
    // 遍历所有存在的状态节点
    while (Q.length > 0) {
        var state = Q.shift();
        if (marked[state]) {
            continue;
        }

        var nfaStates = Conceal.parse(state);
        for (var p of nfaStates) {
            if (nfa.isFinalState(p)) {
                this.finalStates.add(state);
                break;
            }
        }

        // add the set , where here is that of NFA M2, as a state to Q if it is not already in Q for each symbol a in  .
        for (var a of this.charset) {
            var newState = [];
            for (var p of nfaStates) {
                if (!(p in nfa._transitions)
                    || !(a in nfa._transitions[p])
                ) {
                    continue;
                }

                newState = newState.concat(nfa._transitions[p][a]);
            }

            if (newState.length === 0) {
                continue;
            }

            newState = new Set(newState);
            newState = Array.from(newState).reduce(function(acc, val) {
                return acc.concat(epsClosure(val));
            }, []);
            newState = new Set(newState);
            newState = Array.from(newState).sort(numCmp);
            newState = Conceal.stringify(newState);

            // For this new state, add ( q, a ) =   to  , where the  on the right hand side is that of NFA M2.
            this.addTransition(state, newState, a);
            if (marked[newState] !== true) {
                Q.push(newState);
            }
        }

        marked[state] = true;
    }

    // When no more new states can be added to Q, the process terminates. All the states of Q that contain accepting states of M2 are accepting states of M.
};

//最小化DFA
DFA.minifyDFA = function (dfa,charset) {
    var minidfa = new DFA(charset);
    minidfa._state = dfa._state;
    minidfa._minifyDFA(dfa);
    return minidfa;
}

DFA.prototype._minifyDFA=function (dfa) {
    this.initialState = dfa.initialState;

    //深拷贝
    this._transitions = JSON.parse(JSON.stringify(dfa._transitions));

    //第一次状态划分
    this.finalStates = new Set();
    for(let val of dfa.finalStates) {
        this.finalStates.add(val)
    }
    let flag = true,
        //状态归档，记录上一次状态，若一样跳出循环
        archive = JSON.stringify(this._transitions);
    // let endState = this.newState();
    while (flag) {

        //处理终态，合并相同项
        let endStates = new Map(),tmp_final = [];
        for (const finalStateKey of this.finalStates) {
            let obj =  this._transitions[finalStateKey];
            let s = JSON.stringify(obj);
            if (obj === undefined) {
                s = JSON.stringify({})
            }
            if (endStates.has(s)) {
                let oldState = endStates.get(s);
                this.replaceState(oldState,finalStateKey);
                continue;
            }

            endStates.set(s,finalStateKey);
        }
        //拿到endStates,进一步合并
        let endStatesKey,keys = [...endStates.keys()];
        for (let i = 0; i < endStates.size;i ++) {
            endStatesKey = keys[i];

            let stateObj = JSON.parse(endStatesKey);
            for (const finalStatesKey of this.finalStates) {
                let obj = this._transitions[finalStatesKey]||{};
                if (JSON.stringify(obj) === endStatesKey||(!endStates.has(endStatesKey))) {
                    continue;
                }

                //判断当前两个终态是否是相同状态
                let isSame = true;
                for (const charsetKey of this.charset) {
                    // if (
                    //     obj&&
                    //     charsetKey in obj&&
                    //     this._transitions[obj[charsetKey]] &&
                    //     charsetKey in this._transitions[obj[charsetKey]]&&
                    //     this._transitions[obj[charsetKey]][charsetKey] === stateObj[charsetKey]
                    // ) {
                    //     obj[charsetKey] = stateObj[charsetKey];
                    //     //修正endStates
                    //     endStates.set(JSON.stringify(obj),endStates.get(endStatesKey));
                    //     endStates.delete(endStatesKey);
                    //     endStatesKey = JSON.stringify(obj);
                    //     keys[i] = endStatesKey;
                    //     console.log(endStates);
                    //     continue;
                    // }

                    if (
                        // (!(charsetKey in obj) ||
                            obj[charsetKey] === stateObj[charsetKey]) {
                        continue;
                    }
                    isSame = false;
                    break;
                }

                if (isSame) {
                    let state = endStates.get(endStatesKey);
                    this.replaceState(state,finalStatesKey);
                    let k = JSON.stringify(obj);
                    endStates.delete(k);
                }
            }
        }



        //求出相同状态
        //@TODO 改为上面一样的方式判断，并且合并如果有状态指向自己其它状态指向一致的状态
        let diffStates = {};
        for (let state in this._transitions) {
            let s = JSON.stringify(this._transitions[state]);
            if (s in diffStates||this.isFinalState(state)) {
                continue;
            }

            diffStates[s]=state;
        }


        //移除相同状态
        for (const diffState in diffStates) {
            let first_index = diffStates[diffState];
            for (const transitionsKey in this._transitions) {
                // if (this.isFinalState(transitionsKey)) continue;

                let s = JSON.stringify(this._transitions[transitionsKey]);
                if (s === diffState&&
                    first_index !== transitionsKey) {
                    this.replaceState(Number(first_index),Number(transitionsKey));
                    if (s in diffStates) {
                        delete diffStates[s];
                    }
                }
                else if (s !== diffState&&first_index !== transitionsKey){
                    let obj = this._transitions[transitionsKey];
                    let stateObj = JSON.parse(diffState);
                    let isSame = true;
                    for (const charsetElement of this.charset) {
                        if ((!(charsetElement in obj)&&(charsetElement in stateObj))
                            ||(!(charsetElement in stateObj)&&(charsetElement in obj))) {
                            isSame = false;
                            break;
                        }

                        if (obj[charsetElement] === Number(transitionsKey)
                            &&stateObj[charsetElement] === Number(diffStates[diffState])) {
                            continue;
                        }
                        if (obj[charsetElement] === stateObj[charsetElement]) {
                            continue;
                        }

                        isSame = false;
                        break;
                    }

                    if (isSame) {
                        this.replaceState(Number(first_index),Number(transitionsKey));
                        if (s in diffStates) {
                            delete diffStates[s];
                        }
                    }
                }
            }
        }

        if (archive === JSON.stringify(this._transitions)) {
            flag = false;
        } else {
            archive = JSON.stringify(this._transitions);
        }

    }
}

DFA.prototype.replaceState = function (movedState,state2Moved) {
    delete this._transitions[state2Moved];
    this._transitions = JSON.parse(JSON.stringify(this._transitions).replaceAll(state2Moved,function (state2Moved,index,s) {
        if (Number(s[index-1])||Number(s[index+state2Moved.length])) {
            return state2Moved;
        } else {
            return movedState;
        }
    }));

    if (this.initialState === state2Moved) {
        this.initialState = movedState;
    }
    if (this.isFinalState(state2Moved)) {
        this.finalStates.delete(state2Moved);
        this.finalStates.add(movedState);
    }
}
