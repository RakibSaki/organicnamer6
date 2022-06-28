function Distance(distance, atom) {
    this.distance = distance
    this.atom = atom
}

function Chain(start, end) {
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