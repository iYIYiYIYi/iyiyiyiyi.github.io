var NFA = function(charset, initialState, finalState) {
    this.initialState = initialState; //初始状态
    this.finalState = finalState; //结束状态
    this.charset = charset || ''; //状态表
    this._transitions = []; //状态转移表
    this._state = 0; //状态计数器
};
NFA.EPS = 'ε';
NFA.characters = {
  '*':'star',
  '|':'or',
  '·':'mul'
};

NFA.prototype.newState = function() {
    this._transitions.push({});

    return this._state++;
};

NFA.prototype.isFinalState = function(state) {
    return this.finalState === state;
};

NFA.prototype.addTransition = function(from, to, accept) {
    accept = accept || NFA.EPS;
    if (!this._transitions[from][accept]) {
        this._transitions[from][accept] = [];
    }

    this._transitions[from][accept].push(to);
};

/**
 * 由逆波兰表达式构建NFA
 * @param polished 表达式
 * @returns {*} 起始节点
 */
NFA.fromPolishedRegex = function(charset,polished){
    var nfa = new this(charset);
    var states = nfa._fromPolishedRegex(polished);
    nfa.initialState = states['initialState'];
    nfa.finalState = states['finalState'];

    return nfa;
}

NFA.prototype._fromPolishedRegex = function(polished){
    let initalState;
    let finalState;

    let nfa_stack = [];
    for (let i = 0; i < polished.length; i++) {
        let type = NFA.characters[polished[i]];

        switch (type) {
            //字母，构架基本NFA
            case undefined:{
                let accept = polished[i]
                initalState = this.newState();
                finalState = this.newState();
                this.addTransition(initalState,finalState,accept)
                nfa_stack.push({
                    'initialState':initalState,
                    'finalState':finalState
                })
                break;
            };
            //运算符 |
            case 'or':{
                let r = nfa_stack.pop()
                let l = nfa_stack.pop()

                initalState = this.newState();
                finalState = this.newState();
                this.addTransition(initalState,r['initialState']);
                this.addTransition(initalState,l['initialState']);
                this.addTransition(r['finalState'],finalState);
                this.addTransition(l['finalState'],finalState);
                nfa_stack.push({
                    'initialState':initalState,
                    'finalState':finalState
                })
                break;
            };
            //运算符 ·
            case 'mul':{
                let r = nfa_stack.pop()
                let l = nfa_stack.pop()

                if (!r||!l) {
                    throw new Error("Illegal Syntax")
                }
                this.addTransition(l['finalState'],r['initialState']);
                initalState = l['initialState'];
                finalState = r['finalState'];
                nfa_stack.push({
                    'initialState':initalState,
                    'finalState':finalState
                })
                break;
            };
            //运算符 *
            case 'star':{
                let c = nfa_stack.pop()

                if (!c) {
                    throw new Error("Illegal Syntax")
                }
                this.addTransition(c['finalState'],c['initialState']);
                initalState = this.newState();
                finalState = this.newState();
                this.addTransition(initalState,finalState);
                this.addTransition(initalState,c['initialState']);
                this.addTransition(c['finalState'],finalState);
                nfa_stack.push({
                    'initialState':initalState,
                    'finalState':finalState
                })
                break;
            };
        }
    }

    return {
        'initialState':initalState,
        'finalState':finalState
    }
}

