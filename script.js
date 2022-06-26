class Distance(distance, atom) {
    this.distance = distance
    this.atom = atom
}

function Atom(x, y, bondTo) {
    let distances = []
    if (!bondTo) {
        this.molecule = new Molecule(this)
    } else {
        this.molecule = bondTo.molecule
        this.molecule.add(this)
        // record new distance for this atom
        distances.push(new Distance(1, bondTo))
        bondTo.distances.push(new Distance(1, this))
        // record new distance for bonded atom
        for (let distance of bondTo.distances) {
            // record new distance for this atom
            distances.push(new Distance(distance.distance+1, distance.atom))
            // record new distance for other atom
            distance.atom.distances.push(new Distance(distance.distance+1, this))
        }
    }
    this.distanceTo(atom) {
        for (let distance of distances) {
            if (distance.atom == atom) {
                return distance.distance
            }
        }
    }
}

function Molecule(atom) {
    let atoms = [atom]
    this.add = a => atoms.push(a)

}