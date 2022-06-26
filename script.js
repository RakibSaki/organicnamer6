function Distance(distance, atom) {
    this.distance = distance
    this.atom = atom
}

function Atom(x, y, bondTo) {
    let distances = []
    let bonds
    this.addBond = () => bonds++
    this.bondsFull = () => bonds == 4
    this.recordDistance = (distance, atom) => {
        distances.push(new Distance(distance, atom))
    }
    if (!bondTo) {
        this.molecule = new Molecule(this)
        bonds = 1
    } else {
        bonds = 1
        bondTo.addBond()
        this.molecule = bondTo.molecule
        this.molecule.add(this)
        // record new distance for this atom
        this.recordDistance(1, bondTo)
        // record new distance for bonded atom
        bondTo.recordDistance(1, this)
        for (let distance of bondTo.peekDistances()) {
            // record new distance for this atom
            this.recordDistance(distance.distance+1, distance.atom)
            // record new distance for other atom
            distance.atom.recordDistance(distance.distance+1, this)
        }
    }
    this.distanceTo = (atom) => {
        for (let distance of distances) {
            if (distance.atom == atom) {
                return distance.distance
            }
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

}