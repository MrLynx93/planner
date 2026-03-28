package com.planner.service;

import com.planner.dto.AnnexDto;
import com.planner.entity.Annex;
import com.planner.entity.AnnexState;
import com.planner.repository.AnnexRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnexService {

    private final AnnexRepository annexRepository;

    public List<AnnexDto> findAll() {
        return annexRepository.findAll().stream().map(this::toDto).toList();
    }

    public AnnexDto findById(Integer id) {
        return toDto(getOrThrow(id));
    }

    public AnnexDto create(AnnexDto dto) {
        if (annexRepository.existsByState(AnnexState.DRAFT)) {
            throw new IllegalStateException("A DRAFT annex already exists");
        }
        Annex annex = new Annex();
        annex.setState(AnnexState.DRAFT);
        apply(annex, dto);
        return toDto(annexRepository.save(annex));
    }

    public AnnexDto update(Integer id, AnnexDto dto) {
        Annex annex = getOrThrow(id);
        if (annex.getState() == AnnexState.FINISHED) {
            throw new IllegalStateException("Cannot edit a FINISHED annex");
        }
        apply(annex, dto);
        return toDto(annexRepository.save(annex));
    }

    public void delete(Integer id) {
        Annex annex = getOrThrow(id);
        if (annex.getState() == AnnexState.FINISHED) {
            throw new IllegalStateException("Cannot delete a FINISHED annex");
        }
        annexRepository.delete(annex);
    }

    @Transactional
    public AnnexDto activate(Integer id) {
        Annex draft = getOrThrow(id);
        if (draft.getState() != AnnexState.DRAFT) {
            throw new IllegalStateException("Only a DRAFT annex can be activated");
        }
        annexRepository.findByState(AnnexState.CURRENT).ifPresent(current -> {
            current.setState(AnnexState.FINISHED);
            current.setEndDate(LocalDate.now());
            annexRepository.save(current);
        });
        draft.setState(AnnexState.CURRENT);
        draft.setStartDate(LocalDate.now());
        draft.setEndDate(null);
        return toDto(annexRepository.save(draft));
    }

    public Annex getOrThrow(Integer id) {
        return annexRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Annex not found: " + id));
    }

    private void apply(Annex annex, AnnexDto dto) {
        annex.setName(dto.name());
        annex.setOpeningTime(dto.openingTime());
        annex.setClosingTime(dto.closingTime());
    }

    public AnnexDto toDto(Annex annex) {
        return new AnnexDto(
                annex.getId(),
                annex.getName(),
                annex.getStartDate(),
                annex.getEndDate(),
                annex.getOpeningTime(),
                annex.getClosingTime(),
                annex.getState()
        );
    }
}
