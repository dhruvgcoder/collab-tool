const express = require('express');
const Drawing = require('../models/Drawing');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all drawings for current user
router.get('/', auth, async (req, res) => {
  try {
    const drawings = await Drawing.find({
      $or: [
        { owner: req.userId },
        { collaborators: req.userId }
      ]
    }).sort({ updatedAt: -1 });
    
    res.json(drawings);
  } catch (error) {
    console.error('Get drawings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific drawing
router.get('/:id', auth, async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    
    if (!drawing) {
      return res.status(404).json({ message: 'Drawing not found' });
    }
    
    // Check if user has access to this drawing
    if (
      drawing.owner.toString() !== req.userId &&
      !drawing.collaborators.includes(req.userId) &&
      !drawing.isPublic
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(drawing);
  } catch (error) {
    console.error('Get drawing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new drawing
router.post('/', auth, async (req, res) => {
  try {
    const { title, elements, isPublic } = req.body;
    
    const drawing = new Drawing({
      title,
      elements,
      owner: req.userId,
      isPublic
    });
    
    await drawing.save();
    
    // Add drawing to user's drawings
    await User.findByIdAndUpdate(
      req.userId,
      { $push: { drawings: drawing._id } }
    );
    
    res.status(201).json(drawing);
  } catch (error) {
    console.error('Create drawing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a drawing
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, elements, isPublic, collaborators } = req.body;
    
    let drawing = await Drawing.findById(req.params.id);
    
    if (!drawing) {
      return res.status(404).json({ message: 'Drawing not found' });
    }
    
    // Check if user is the owner
    if (drawing.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    drawing.title = title || drawing.title;
    drawing.elements = elements || drawing.elements;
    
    if (isPublic !== undefined) {
      drawing.isPublic = isPublic;
    }
    
    if (collaborators) {
      drawing.collaborators = collaborators;
    }
    
    await drawing.save();
    
    res.json(drawing);
  } catch (error) {
    console.error('Update drawing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a drawing
router.delete('/:id', auth, async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    
    if (!drawing) {
      return res.status(404).json({ message: 'Drawing not found' });
    }
    
    // Check if user is the owner
    if (drawing.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await drawing.remove();
    
    // Remove drawing from user's drawings
    await User.findByIdAndUpdate(
      req.userId,
      { $pull: { drawings: req.params.id } }
    );
    
    res.json({ message: 'Drawing deleted' });
  } catch (error) {
    console.error('Delete drawing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;