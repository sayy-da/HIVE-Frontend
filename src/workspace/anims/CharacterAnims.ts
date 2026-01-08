import Phaser from 'phaser'

export const createCharacterAnims = (anims: Phaser.Animations.AnimationManager) => {
  const animsFrameRate = 15
  const characters = ['adam', 'ash', 'lucy', 'nancy']

  characters.forEach((char) => {
    // Idle animations
    ;['right', 'up', 'left', 'down'].forEach((dir, dirIndex) => {
      anims.create({
        key: `${char}_idle_${dir}`,
        frames: anims.generateFrameNames(char, {
          start: dirIndex * 6,
          end: dirIndex * 6 + 5,
        }),
        repeat: -1,
        frameRate: animsFrameRate * 0.6,
      })
    })

    // Run animations
    ;['right', 'up', 'left', 'down'].forEach((dir, dirIndex) => {
      anims.create({
        key: `${char}_run_${dir}`,
        frames: anims.generateFrameNames(char, {
          start: 24 + dirIndex * 6,
          end: 24 + dirIndex * 6 + 5,
        }),
        repeat: -1,
        frameRate: animsFrameRate,
      })
    })

    // Sit animations
    ;['down', 'left', 'right', 'up'].forEach((dir, dirIndex) => {
      anims.create({
        key: `${char}_sit_${dir}`,
        frames: anims.generateFrameNames(char, {
          start: 48 + dirIndex,
          end: 48 + dirIndex,
        }),
        repeat: 0,
        frameRate: animsFrameRate,
      })
    })
  })
}

