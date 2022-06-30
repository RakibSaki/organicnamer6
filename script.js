function Distance(distance, atom) {
    this.distance = distance
    this.atom = atom
}

function Chain(start, end) {
    this.start = start
    this.end = end
    this.length = start.distanceTo(end) + 1
    let atoms = []
    this.recordAtoms = () => {
        let atom = start
        atoms.push(atom)
        let distance = this.length - 1
        while (atom != end) {
            for (let i = 0; i < atom.bondAtoms.length; i++) {
                let thisDistance = atom.bondAtoms[i].distanceTo(end)
                if (thisDistance == distance - 1) {
                    atom = atom.bondAtoms[i]
                    continue
                }
            }
        }
    }
}

function Atom(x, y, bondTo) {
    let distances = []
    let bonds = 0
    let bondAtoms = []
    this.addBond = atom => {
        bonds++
        bondAtoms.push(atom)
    }
    this.bondsFull = () => bonds == 4
    this.recordDistance = (distance, atom) => {
        distances.push(new Distance(distance, atom))
    }
    if (!bondTo) {
        this.molecule = new Molecule(this)
    } else {
        bondTo.addBond(atom)
        this.addBond(bondTo)
        this.molecule = bondTo.molecule
        this.molecule.add(this)
        // record new distance for this atom
        this.recordDistance(1, bondTo)
        // record new distance for bonded atom
        bondTo.recordDistance(1, this)
        for (let distance of bondTo.peekDistances()) {
            // record new distance for this atom
            this.recordDistance(distance.distance + 1, distance.atom)
            // record new distance for other atom
            distance.atom.recordDistance(distance.distance + 1, this)
        }
    }
    this.distanceTo = (atom) => {
        for (let distance of distances) {
            if (distance.atom == atom) {
                return distance.distance
            }
        }
        // distance from this atom to this atom is 0
        if (atom == this) {
            return 0
        }
    }
    this.peekDistances = () => distances
    this.peekPosition = () => [x, y]
    this.draw = () => {
        let element = document.createElement('div')
        element.classList.add('atom')
        element.style.transform = `translate(${x}px, ${y}px)`
        document.body.appendChild(element)
        this.element = element
        if (!bondTo) {
            return
        }
        let bondLine = document.createElement('div')
        bondLine.classList.add('bond')
        let [bondToX, bondToY] = bondTo.peekPosition()
        bondLine.style.left = `${(x + bondToX) / 2}px`
        bondLine.style.top = `${(y + bondToY) / 2}px`
        let width = Math.sqrt(((x - bondToX) * (x - bondToX)) + ((y - bondToY) * (y - bondToY)))
        bondLine.style.width = `${width}px`
        let rotate = Math.atan((bondToY - y) / (bondToX - x))
        bondLine.style.transform = `translate(${width / -2}px, -1px) rotate(${rotate}rad)`
        bondLine.style.zIndex = '-1'
        document.body.appendChild(bondLine)
    }
}

function Molecule(atom) {
    let atoms = [atom]
    this.add = a => atoms.push(a)
    this.name = () => {
        /*
        longest chain
        branch that is closest
        closest branch is alphabetically first
        next closest branch is closest
        ...
        */
        // get chains
        let terminalAtoms = []
        for (let i = 0; i < atoms.length; i++) {
            if (atoms[i].bonds == 1) {
                terminalAtoms.push(atoms[i])
            }
        }
        let chains = []
        for (let i = 0; i < terminalAtoms.length; i++) {
            for (let j = 0; j < terminalAtoms.length; j++) {
                if (j != i) {
                    chains.push(new Chain(terminalAtoms[i], terminalAtoms[j]))
                }
            }
        }
        let longestChains = chooseBests(chains, chain => chain.length)
    }
    this.nameBranchRoot = (fromAtom, startAtom) => {
        /*
        find atoms in branch
        find terminal atoms
        find largest chains between terminal atoms or from a terminal atom to startAtom
        choose chain that is closest to start of branch
        choose chain that has most subbranches
        choose chains that starts subbranches first
        choose chains that starts branches alphabetically lower
        // above step requires recursive use of this function
        repeat for next closest subbranches until
            one chain is best
            or all subbranches checked (chains symmetrical) in which case pick randomly
        name of branch root is meth/eth/prop-yl or meth/eth/prop-position-yl if branch starts at mid of chain
        */
        let branchAtoms = []
        for (let i = 0; i < atoms.length; i++) {
            if (atoms[i].distanceTo(fromAtom) > atoms[i].distanceTo(startAtom)) {
                branchAtoms.push(atoms[i])
            }
        }
        let terminalAtoms = [startAtom]
        for (let i = 0; i < branchAtoms.length; i++) {
            if (branchAtoms[i].bonds == 1) {
                terminalAtoms.push(branchAtoms[i])
            }
        }
        let chains = []
        for (let i = 0; i < terminalAtoms.length; i++) {
            for (let j = 0; j < terminalAtoms.length; j++) {
                let firstDistance = terminalAtoms[i].distanceTo(startAtom)
                let secondDistance = startAtom.distanceTo(terminalAtoms[j])
                let totalDistance = terminalAtoms[i].distanceTo(terminalAtoms[j])
                // notice chain only if it includes start of branch and starts close to start of branch
                if (firstDistance + secondDistance == totalDistance && firstDistance <= secondDistance) {
                    chains.push(new Chain(terminalAtoms[i], terminalAtoms[j]))
                }
            }
        }
        // longest chains
        chains = chooseBests(chains, chain => chain.length)
        // chains starting closest to start of branch
        chains = chooseBests(chains, chain => chain.end.distanceTo(startAtom))

        for (let i = 0; i < chains.length; i++) {
            chains[i].recordAtoms()
        }
        // chains with most subbranches
        chains = chooseBest(chains, chain => {
            let branches = 0
            for (let i = 1; i < chain.atoms.length - 1; i++) {
                if (chain.atoms[i].branches > 2) {
                    for (let j = 0; j < chain.atoms[i].branchAtoms.length; j++) {
                        if (chain.atoms[i].branchAtoms[j] != chain.atoms[i-1] && chain.atoms[i].branchAtoms[j] != chain.atoms[i+1] && chain.atoms[i].branchAtoms[j] != startAtom) {
                            branches++
                        }
                    }
                }
            }
        })
    }
}

function chooseBests(list, goodness) {
    if (list.length < 1) {
        return []
    }
    bests = [list[0]]
    bestGoodness = goodness[best[0]]
    for (let i = 1; i < list.length; i++) {
        thisGoodness = goodness(list[i])
        if (thisGoodness > bestGoodness) {
            bests = [list[i]]
        } else if (thisGoodness == bestGoodness) {
            bests.push(list[i])
        }
    }
    return bests
}

function nameBranch(fromAtom, startAtom) {
    /*
    nameBranchRoot
    name of branch is ...position-nameBrach(subbranch)...+rootname
    */
}

