"""Build the original Kai rig and the modular kit with Blender 4.5 LTS."""
from math import pi
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

SOURCE = Path(__file__).resolve().parent
OUT = SOURCE.parents[1] / "game/public/assets/prototype3d"

PALETTE = {
    "Ceramic": ("c9ded9", 0.32, 0.34, 0),
    "Carbon": ("142833", 0.42, 0.50, 0),
    "Joints": ("4a6570", 0.48, 0.36, 0),
    "Signal": ("f9ad51", 0.36, 0.30, 0),
    "Core": ("56ece4", 0.27, 0.38, 1.25),
    "Deck": ("2b5b5f", 0.62, 0.35, 0),
    "Deck panel": ("366b6f", 0.54, 0.33, 0),
    "Deck steel": ("2b434c", 0.55, 0.45, 0),
    "Edge": ("84e7d3", 0.32, 0.25, 0.55),
}


def linear(v):
    return v / 12.92 if v < 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.context.scene.render.fps = 30
    for name, (color, rough, metal, emission) in PALETTE.items():
        rgba = tuple(linear(int(color[i:i+2], 16) / 255) for i in (0, 2, 4)) + (1,)
        material = bpy.data.materials.new(name)
        material.diffuse_color = rgba
        material.use_nodes = True
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Metallic"].default_value = metal
        bsdf.inputs["Roughness"].default_value = rough
        bsdf.inputs["Emission Color"].default_value = rgba
        bsdf.inputs["Emission Strength"].default_value = emission


def finish_geometry(name, material):
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name
    obj.data.materials.append(bpy.data.materials[material])
    return obj


def plate(name, at, size, material, bevel=0.025, tilt=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    obj = finish_geometry(name, material)
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.x = tilt
    if bevel:
        modifier = obj.modifiers.new(name="Hard edges", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def cylinder(name, at, radius, depth, material, angle=0):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8, radius=radius, depth=depth, location=at, rotation=(angle, 0, 0)
    )
    return finish_geometry(name, material)


def bone_setup():
    rig_data = bpy.data.armatures.new("Kai Skeleton")
    rig = bpy.data.objects.new("Kai Rig", rig_data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    rig.show_in_front = True
    rig_data.display_type = "STICK"
    bpy.ops.object.mode_set(mode="EDIT")

    def bone(name, head, tail, parent=None):
        item = rig_data.edit_bones.new(name)
        item.head, item.tail = head, tail
        if parent:
            item.parent = rig_data.edit_bones[parent]
        return item

    bone("Pelvis", (0, 0, .80), (0, 0, 1.0))
    bone("Spine", (0, 0, .98), (0, 0, 1.32), "Pelvis")
    bone("Helmet", (0, 0, 1.30), (0, 0, 1.68), "Spine")
    for suffix, side in (("L", -1), ("R", 1)):
        x = side * .17
        bone(f"Thigh.{suffix}", (x, 0, .84), (x, 0, .46), "Pelvis")
        bone(f"Shin.{suffix}", (x, 0, .46), (x, 0, .12), f"Thigh.{suffix}")
        x = side * .34
        bone(f"Arm.{suffix}", (x, 0, 1.23), (x, 0, 1.00), "Spine")
        tail = (x, -.30 if side == 1 else -.03, 1.02 if side == 1 else .80)
        bone(f"Forearm.{suffix}", (x, 0, 1.0), tail, f"Arm.{suffix}")
    bpy.ops.object.mode_set(mode="OBJECT")
    return rig


def skin(rig, part, bone):
    weight = part.vertex_groups.new(name=bone)
    weight.add(list(range(len(part.data.vertices))), 1.0, "REPLACE")
    pose = part.modifiers.new(name="Kai Skeleton", type="ARMATURE")
    pose.object = rig
    part.parent = rig


def kai_model():
    reset()
    rig = bone_setup()

    def armor(bone, name, at, size, material="Ceramic", bevel=.025, tilt=0):
        skin(rig, plate(name, at, size, material, bevel, tilt), bone)

    def tube(bone, name, at, radius, depth, material, angle=0):
        skin(rig, cylinder(name, at, radius, depth, material, angle), bone)

    armor("Pelvis", "Hip shell", (0, 0, .85), (.41, .27, .17), "Carbon")
    armor("Pelvis", "Belt light", (0, -.147, .85), (.24, .026, .036), "Signal", .008)
    armor("Spine", "Torso undersuit", (0, 0, 1.075), (.39, .31, .32), "Carbon")
    armor("Spine", "Chest armor", (0, -.043, 1.148), (.48, .34, .26), bevel=.058, tilt=-.12)
    armor("Spine", "Chest armor spine", (0, .147, 1.10), (.29, .21, .34), "Joints", .04)
    armor("Spine", "Backpack", (0, .244, 1.11), (.30, .16, .31), "Carbon", .036)
    for side in (-1, 1):
        armor("Spine", "Thruster slit", (side * .09, .33, 1.11), (.028, .021, .16), "Core", .007)
        armor("Spine", "Breastplate accent", (side * .14, -.220, 1.16), (.077, .017, .035), "Signal", .008)
    armor("Spine", "Reactor mount", (0, -.213, 1.117), (.16, .063, .15), "Carbon", .031)
    armor("Spine", "Reactor core", (0, -.249, 1.12), (.072, .02, .082), "Core", .015)
    armor("Helmet", "Neck seal", (0, 0, 1.325), (.20, .18, .105), "Carbon")
    armor("Helmet", "Helmet shell", (0, 0, 1.499), (.445, .399, .342), bevel=.086)
    armor("Helmet", "Face seal", (0, -.189, 1.49), (.34, .072, .20), "Carbon", .035)
    armor("Helmet", "Visor", (0, -.229, 1.527), (.306, .04, .067), "Core", .017)
    armor("Helmet", "Crown stripe", (0, -.069, 1.673), (.051, .208, .031), "Signal", .012)
    armor("Helmet", "Helmet antenna", (-.195, .052, 1.676), (.06, .053, .195), "Joints", .015, .13)
    armor("Helmet", "Antenna signal", (-.195, .034, 1.775), (.064, .054, .028), "Core", .009)
    for suffix, side in (("L", -1), ("R", 1)):
        x = side * .17
        thigh, shin = f"Thigh.{suffix}", f"Shin.{suffix}"
        armor(thigh, "Leg joint", (x, 0, .67), (.169, .192, .32), "Carbon")
        armor(thigh, "Thigh armor", (x, -.032, .662), (.221, .21, .24), bevel=.036)
        armor(shin, "Calf", (x, 0, .292), (.183, .177, .31), "Joints")
        armor(shin, "Shin armor", (x, -.046, .291), (.225, .186, .255), bevel=.038)
        armor(shin, "Knee shield", (x, -.104, .455), (.21, .116, .115), "Signal", .035)
        armor(shin, "Boot", (x, -.055, .091), (.24, .354, .152), "Carbon", .034)
        armor(shin, "Toe plate", (x, -.153, .10), (.215, .174, .11), bevel=.031)
        arm, forearm = f"Arm.{suffix}", f"Forearm.{suffix}"
        x = side * .35
        armor(arm, "Upper arm", (x, 0, 1.10), (.16, .173, .24), "Joints")
        armor(arm, "Pauldron", (x, -.005, 1.233), (.244, .251, .176), bevel=.046)
        armor(arm, "Shoulder marking", (x + side * .055, -.122, 1.233),
              (.091, .026, .052), "Signal", .008)
        if side < 0:
            armor(forearm, "Forearm guard", (x, -.027, .944), (.179, .20, .21), bevel=.029)
            armor(forearm, "Left glove", (x, -.021, .813), (.14, .143, .11), "Carbon", .023)
    arm = "Forearm.R"
    armor(arm, "Arc Cannon housing", (.365, -.124, 1.003), (.260, .325, .236), "Carbon", .046)
    armor(arm, "Arc Cannon upper shell", (.365, -.155, 1.09), (.250, .335, .12), bevel=.037)
    armor(arm, "Arc Cannon side power cell", (.492, -.16, 1.00), (.025, .18, .066), "Core", .009)
    tube(arm, "Barrel chassis", (.365, -.367, 1.005), .098, .222, "Joints", pi / 2)
    tube(arm, "Arc Cannon muzzle rim", (.365, -.485, 1.005), .128, .079, "Ceramic", pi / 2)
    tube(arm, "Arc Cannon emitter", (.365, -.531, 1.005), .077, .026, "Core", pi / 2)

    socket = bpy.data.objects.new("Muzzle", None)
    bpy.context.collection.objects.link(socket)
    socket.empty_display_size = .07
    socket.parent, socket.parent_type, socket.parent_bone = rig, "BONE", arm
    socket.matrix_world = Matrix.Translation(Vector((.365, -.561, 1.005)))
    make_clips(rig)
    save(rig, "kai", animations=True)


def make_clips(rig):
    idle = {}
    clips = {
        "Idle": [(1, idle, 0), (19, {"Spine": .035, "Helmet": -.028}, .024), (37, idle, 0)],
        "Run": [
            (1, {"Thigh.L": -.63, "Thigh.R": .55, "Shin.R": -.41, "Arm.L": .46, "Spine": .12}, .005),
            (6, {"Thigh.L": -.12, "Thigh.R": .20, "Shin.R": -.78, "Arm.L": .03, "Spine": .10}, .048),
            (10, {"Thigh.L": .55, "Thigh.R": -.63, "Shin.L": -.41, "Arm.L": -.43, "Spine": .12}, .005),
            (15, {"Thigh.L": .19, "Thigh.R": -.13, "Shin.L": -.78, "Arm.L": -.05, "Spine": .10}, .048),
            (19, {"Thigh.L": -.63, "Thigh.R": .55, "Shin.R": -.41, "Arm.L": .46, "Spine": .12}, .005),
        ],
        "Jump": [(1, {"Thigh.L": -.40, "Thigh.R": -.59, "Shin.L": -.66, "Shin.R": -.75, "Arm.L": -.50}, 0),
                 (12, {"Thigh.L": -.49, "Thigh.R": -.52, "Shin.L": -.58, "Shin.R": -.67, "Arm.L": -.49}, .045)],
        "Fall": [(1, {"Thigh.L": -.23, "Thigh.R": .21, "Shin.L": -.28, "Shin.R": -.24, "Arm.L": -.33}, 0),
                 (13, {"Thigh.L": -.35, "Thigh.R": .31, "Shin.L": -.35, "Shin.R": -.33, "Arm.L": -.44}, 0)],
        "Land": [(1, {"Spine": .23, "Thigh.L": -.36, "Thigh.R": -.36, "Shin.L": -.53, "Shin.R": -.53}, -.085),
                 (8, idle, 0)],
        "Dash": [(1, {"Spine": .42, "Thigh.L": -.65, "Thigh.R": .59, "Shin.L": -.5, "Arm.L": .68}, -.065),
                 (10, {"Spine": .37, "Thigh.L": -.54, "Thigh.R": .47, "Shin.L": -.42, "Arm.L": .60}, -.04)],
        "Shoot": [(1, {"Arm.R": -.19, "Forearm.R": -.09, "Spine": -.07}, 0),
                  (3, {"Arm.R": -.30, "Forearm.R": -.13, "Spine": -.10}, 0),
                  (9, idle, 0)],
    }
    data = rig.animation_data_create()
    next_frame = 1
    for clip, poses in clips.items():
        action = bpy.data.actions.new(clip)
        action.use_fake_user = True
        data.action = action
        for frame, angles, bob in poses:
            for pose in rig.pose.bones:
                pose.rotation_mode = "XYZ"
                pose.rotation_euler = (angles.get(pose.name, 0), 0, 0)
                pose.location = (0, bob if pose.name == "Pelvis" else 0, 0)
                pose.keyframe_insert(data_path="rotation_euler", frame=frame, group=pose.name)
                if pose.name == "Pelvis":
                    pose.keyframe_insert(data_path="location", frame=frame, group=pose.name)
        data.action = None
        track = data.nla_tracks.new()
        track.name = clip
        strip = track.strips.new(clip, next_frame, action)
        next_frame = int(strip.frame_end) + 8
    bpy.context.scene.frame_end = next_frame
    bpy.context.scene.frame_set(1)


def terrain_model():
    reset()
    groups = {}
    spread = [("Floor", (0, 0, 0)), ("Platform", (1.6, 0, 0)),
              ("Edge", (0, 1.5, 0)), ("Wall", (1.6, 1.5, 0))]
    for name, at in spread:
        parent = bpy.data.objects.new(name, None)
        parent.location = at
        bpy.context.collection.objects.link(parent)
        groups[name] = parent

    def part(group, name, at, size, material, bevel=.02):
        obj = plate(name, at, size, material, bevel)
        obj.parent = groups[group]

    for group in ("Floor", "Platform"):
        edge = "Edge" if group == "Platform" else "Deck steel"
        thickness = .25 if group == "Platform" else .14
        part(group, "Support slab", (0, 0, -thickness / 2 - .029), (1, 1, thickness), "Deck steel", .04)
        part(group, "Walkable panel", (0, 0, -.022), (.98, .98, .044), "Deck panel", .016)
        part(group, "Inset panel", (0, 0, -.016), (.81, .81, .042), "Deck", .021)
        if group == "Platform":
            for x in (-.445, .445):
                part(group, "Side inset light", (x, 0, -.075), (.108, .79, .032), edge, .009)
            for y in (-.445, .445):
                part(group, "Front inset light", (0, y, -.075), (.79, .108, .032), edge, .009)
    part("Wall", "Bulkhead", (0, 0, .5), (.99, .99, 1), "Deck steel", .056)
    part("Wall", "Cap", (0, 0, .965), (1, 1, .06), "Joints", .022)
    for x in (-.492, .492):
        part("Wall", "Vertical seam", (x, 0, .48), (.021, .76, .042), "Edge", .009)
    part("Edge", "Metal edge", (0, 0, -.061), (1, 1, .122), "Joints", .024)
    part("Edge", "Integrated light", (0, 0, .009), (.88, .62, .027), "Edge", .009)
    save(groups["Floor"], "terrain-kit", animations=False)


def save(selected, name, animations):
    bpy.ops.object.select_all(action="DESELECT")
    selected.select_set(True)
    bpy.context.view_layer.objects.active = selected
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / f"{name}.blend"), compress=True)
    export_glb(name, animations)


def export_glb(name, animations):
    OUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / f"{name}.glb"),
        export_format="GLB",
        export_animations=animations,
        export_animation_mode="NLA_TRACKS",
        # Each runtime clip starts at zero, regardless of where its strip sits in Blender.
        export_anim_slide_to_zero=True,
        export_skins=animations,
    )


if __name__ == "__main__":
    kai_model()
    terrain_model()
