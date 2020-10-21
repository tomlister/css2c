#!/usr/bin/env node
const css = require('css')
const fs = require('fs')
const {c} = require('compile-run')

class c_call {
	constructor(name, args, type) {
		this.name = name
		this.args = args
		this.type = type
	}
	generate() {
		let genargs = '';
		for (let i = 0; i < this.args.length; i++) {
			const arg = this.args[i]
			if (i > 0) {
				genargs += `, ${arg}`
			} else {
				genargs += arg
			}
		}
		if (this.type === undefined) {
			return `	${this.name}(${genargs});\n`
		} else if (this.type == 'return') {
			return `	return ${genargs};\n`
		}
	}
}

class c_function {
	constructor(name, type) {
		this.name = name
		this.type = type
		this.calls = []
	}
	generate() {
		let gen = ''
		gen += `${this.type} ${this.name}() {\n`
		for (let i = 0; i < this.calls.length; i++) {
			const call = this.calls[i]
			gen += call.generate()
		}
		gen += `}\n`
		return gen
	}
	addCall(call) {
		this.calls.push(call)
	}
}

const compile = function(generated) {
	fs.writeFileSync('out.c', generated)
	console.log('Saved transpiled code as out.c')
	console.log('Compiling and running out.c')
	console.log('\n')
	let res = c.runSource(generated)
	res.then(result => {
		process.stdout.write(result.stdout)
	})
	.catch(err => {
		console.log(err);
	})
}

const transpile = function(includes, functions) {
	console.log(`Transpiler: Transpiling...`)
	let generated = ''
	for (const i in includes) {
		if (includes.hasOwnProperty(i)) {
			const include = includes[i];
			generated += `#include ${include}\n`
		}
	}
	for (const f in functions) {
		if (functions.hasOwnProperty(f)) {
			const func = functions[f];
			generated += func.generate()
		}
	}
	return generated
}

const parse = function(path) {
	const cssfile = fs.readFileSync(path, 'utf8')
	let ast = css.parse(cssfile)
	let includes = []
	let functions = []
	for (const r in ast.stylesheet.rules) {
		if (ast.stylesheet.rules.hasOwnProperty(r)) {
			const rule = ast.stylesheet.rules[r]
			const selectorsplit = rule.selectors[0].split(" ")
			let type = selectorsplit[0]
			let funcname = selectorsplit[1].replace('.', '')
			const c_func = new c_function(funcname, type)
			console.log(`Parser: Created new function ${funcname}`)
			for (const d in rule.declarations) {
				if (rule.declarations.hasOwnProperty(d)) {
					const decl = rule.declarations[d]
					if (decl.property === 'include') {
						includes.push(decl.value.replace(/["']/g, ''))
					} else if (decl.property === 'return') {
						let args = decl.value.split(/("[^"]*"|'[^']*'|[\S]+)+/).filter(function(e) { return /\S/.test(e); })
						let call = new c_call(decl.property, args, 'return')
						c_func.addCall(call)
					} else {
						let args = decl.value.split(/("[^"]*"|'[^']*'|[\S]+)+/).filter(function(e) { return /\S/.test(e); })
						let call = new c_call(decl.property, args)
						c_func.addCall(call)
					}
				}
			}
			console.log(`Parser: ${funcname} contains ${c_func.calls.length} call(s)`)
			functions.push(c_func)
		}
	}
	return transpile(includes, functions)
}

compile(parse("helloworld.css"))