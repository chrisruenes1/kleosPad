#Kleos

##Minimum Viable Product

Kleos is an interactive audio visualizer inspired by the Korg Kaoss Pad: https://www.youtube.com/watch?v=_iPDHF1RoXA.
By the end of W10, this app will include the following features as a minimum:

- [ ] Mapping of an HTML canvas to a set of audio effects
  - [ ] Pitch shift = change in size
  - [ ] EQ = change in color
  - [ ] Distortion = change in blur
  - [ ] Delay / Echo = change in diameter of reverberations
- [ ] Rendering a collection of movable music notes to the screen
- [ ] Integration of the Web Audio API to process audio effects
- [ ] The ability to store midi data on the backend and play through different songs

##Technologies, Libraries, APIs

Kleos will be built using React.js to make sure that the view is kept up to sync with user changes to the model based on note position. It will also integrate the Web Audio Api in order to generate midi playback and add effects based on user interaction.

The biggest technical challenges will come from creating an intuitive and compelling visualization that reacts to user interaction. Dividing up responsibility for state between React and jQuery will help to keep the problem clear throughout the process and make it more manageable.

##Design Docs
* [View Wireframe][wireframe]
* [Schema Information][schema]

[wireframe]: docs/wireframes/main.png
[schema]: docs/schema.md

##Implementation Timeline

##Phase 1: Basic playback and note rendering

###Objective: Movable notes rendered to screen with basic playback

- [ ] create project
- [ ] generate audio with web audio
- [ ] represent data in a way it can be stored
- [ ] render audio to screen and make notes interactive and movable

##Phase 2: Add audio effects based on note position

###Objective: Generate audio effects based on note position

- [ ] Generate a flux cycle to keep track of note position and percentage of each effect
- [ ] Use web audio to generate effects

##Phase 3: Visualizer

###Objective: Generate a compelling visualizer that responds to changes in audio playback

- [ ] Create canvas
- [ ] Build a basic object that shows pulse somehow
- [ ] Manipulate object to change based on current set of effects
