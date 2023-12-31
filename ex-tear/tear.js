import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js'
import * as CANNON from '/cannon-es.js'
import { Demo } from '/Demo.js'

/**
 * Demo of a chain of bodies which breaks with a certain
 * force threshold.
 */

const demo = new Demo()

demo.addScene('Sphere chain', () => {
    const world = setupWorld(demo)
    // world.solver.setSpookParams(1e20, 3)

    const size = 0.45
    const mass = 1

    // The number of chain links
    const N = 15
    // The distance constraint between those links
    const distance = size * 2 + 0.12

    // To be able to propagate force throw the chain of N spheres, we need at least N solver iterations.
    world.solver.iterations = N

    const sphereShape = new CANNON.Sphere(size)

    const constraints = []
    let lastBody
    for (let i = 0; i < N; i++) {
        // First body is static (mass = 0) to support the other bodies
        const sphereBody = new CANNON.Body({ mass: i === 0 ? 0 : mass })
        sphereBody.addShape(sphereShape)
        sphereBody.position.set(0, (N - i) * distance - 9, 0)
        world.addBody(sphereBody)
        demo.addVisual(sphereBody)

        // Connect this body to the last one added
        if (lastBody) {
            const constraint = new CANNON.DistanceConstraint(sphereBody, lastBody, distance)
            world.addConstraint(constraint)
            constraints.push(constraint)
        }

        // Keep track of the last added body
        lastBody = sphereBody
    }

    world.addEventListener('postStep', () => {
        for (let i = constraints.length - 1; i >= 0; i--) {
            // The multiplier is proportional to how much force that is added to the bodies by the constraint.
            // If this exceeds a limit we remove the constraint.
            const multiplier = Math.abs(constraints[i].equations[0].multiplier)
            if (multiplier > 1000) {
		world.removeConstraint(constraints[i])
            }
        }
    })

    // Throw a body on the chain to break it!
    const sphereBody = new CANNON.Body({ mass: mass * 2 })
    sphereBody.addShape(sphereShape)
    sphereBody.position.set(-20, 3, 0)
    sphereBody.velocity.x = 30
    world.addBody(sphereBody)
    demo.addVisual(sphereBody)
})

function setupWorld(demo) {
    const world = demo.getWorld()
    world.gravity.set(0, -10, 0)

    return world
}

demo.start()
